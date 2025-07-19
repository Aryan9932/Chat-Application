import React, { useContext, useState, useEffect, useRef } from 'react';
import assets from '../assets/assets';
import { formatMessageTime } from '../lib/utils';
import { ChatContext } from '../../context/ChatContext';
import { Authcontext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// Video Call Hook - Modular video call logic
const useVideoCall = (socket, authUser, selectedUser) => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const [callId, setCallId] = useState(null);
  const [connectionState, setConnectionState] = useState('disconnected');
  
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const iceCandidatesQueue = useRef([]);

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  // Initialize peer connection
  const createPeerConnection = () => {
    console.log('🔄 Creating new RTCPeerConnection');
    const peer = new RTCPeerConnection(iceServers);
    
    peer.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log('🧊 Sending ICE candidate:', event.candidate);
        socket.emit('iceCandidate', {
          to: selectedUser._id,
          candidate: event.candidate,
          callId: callId
        });
      }
    };

    peer.ontrack = (event) => {
      console.log('📺 Remote stream received, tracks:', event.streams[0].getTracks());
      setRemoteStream(event.streams[0]);
      // The useEffect below will handle setting srcObject
    };

    peer.onconnectionstatechange = () => {
      setConnectionState(peer.connectionState);
      console.log('🔗 Connection state:', peer.connectionState);
    };

    peer.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', peer.iceConnectionState);
      if (peer.iceConnectionState === 'failed') {
        toast.error('Connection failed. Please try again.');
      }
    };

    peer.onnegotiationneeded = () => {
      console.log('🤝 Negotiation needed');
    };

    return peer;
  };

  // Effect to set local video stream to the video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log('Setting local video srcObject. Stream:', localStream);
      localVideoRef.current.srcObject = localStream;
      // Attempt to play the video once metadata is loaded
      localVideoRef.current.onloadedmetadata = () => {
        localVideoRef.current.play().catch(e => console.error("Error playing local video:", e));
      };
    } else if (localVideoRef.current && !localStream) {
      // Clear srcObject if stream is null
      localVideoRef.current.srcObject = null;
    }
  }, [localStream]);

  // Effect to set remote video stream to the video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log('Setting remote video srcObject. Stream:', remoteStream);
      remoteVideoRef.current.srcObject = remoteStream;
      // Attempt to play the video once metadata is loaded
      remoteVideoRef.current.onloadedmetadata = () => {
        remoteVideoRef.current.play().catch(e => console.error("Error playing remote video:", e));
      };
    } else if (remoteVideoRef.current && !remoteStream) {
      // Clear srcObject if stream is null
      remoteVideoRef.current.srcObject = null;
    }
  }, [remoteStream]);


  // Start a video call
  const startCall = async () => {
    try {
      console.log('📞 Starting call to:', selectedUser.fullName);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      console.log('✅ Got local media stream:', stream);
      setLocalStream(stream); // This will trigger the useEffect for localVideoRef

      const peer = createPeerConnection();
      peerRef.current = peer;

      // Add local stream to peer connection
      stream.getTracks().forEach((track) => {
        console.log('Adding local track to peer:', track);
        peer.addTrack(track, stream);
      });

      // Create offer
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      console.log('📝 Created and set local offer:', offer);

      const newCallId = `${authUser._id}-${selectedUser._id}`;
      setCallId(newCallId);
      setIsInCall(true);

      // Send call to server
      socket.emit('callUser', {
        from: authUser._id,
        to: selectedUser._id,
        offer: offer,
        callId: newCallId
      });

      toast.success('Calling...');
    } catch (err) {
      console.error('❌ Error starting call:', err);
      toast.error('Could not start call: ' + err.message);
      cleanupCall();
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    try {
      console.log('✅ Accepting call from:', selectedUser.fullName);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      console.log('✅ Got local media stream for accepting call:', stream);
      setLocalStream(stream); // This will trigger the useEffect for localVideoRef

      const peer = createPeerConnection();
      peerRef.current = peer;

      // Add local stream to peer connection
      stream.getTracks().forEach((track) => {
        console.log('Adding local track to peer for accepting call:', track);
        peer.addTrack(track, stream);
      });

      // Set remote description
      console.log('Setting remote description with offer:', incomingCall.offer);
      await peer.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      
      // Process queued ICE candidates
      console.log('Processing queued ICE candidates:', iceCandidatesQueue.current.length);
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        try {
          await peer.addIceCandidate(candidate);
          console.log('Added queued ICE candidate:', candidate);
        } catch (e) {
          console.error('Error adding queued ICE candidate:', e);
        }
      }

      // Create answer
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      console.log('📝 Created and set local answer:', answer);

      setCallId(incomingCall.callId);
      setIsInCall(true);

      // Send answer to server
      socket.emit('answerCall', {
        to: incomingCall.from,
        answer: answer,
        callId: incomingCall.callId
      });

      setIncomingCall(null);
      toast.success('Call accepted');
    } catch (err) {
      console.error('❌ Error accepting call:', err);
      toast.error('Could not accept call: ' + err.message);
      cleanupCall();
    }
  };

  // Decline call
  const declineCall = () => {
    console.log('❌ Declining call');
    socket.emit('declineCall', { 
      to: incomingCall.from,
      callId: incomingCall.callId 
    });
    setIncomingCall(null);
    toast.info('Call declined');
  };

  // End call
  const endCall = () => {
    console.log('📴 Ending call');
    socket.emit('endCall', { 
      to: selectedUser._id,
      callId: callId 
    });
    cleanupCall();
    setIsInCall(false);
    toast.info('Call ended');
  };

  // Cleanup call resources
  const cleanupCall = () => {
    console.log('🧹 Cleaning up call resources');
    
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
      console.log('Peer connection closed.');
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped local track:', track.kind);
      });
      setLocalStream(null);
    }
    
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped remote track:', track.kind);
      });
      setRemoteStream(null);
    }

    setCallId(null);
    setConnectionState('disconnected');
    iceCandidatesQueue.current = [];
    console.log('Call resources cleaned up.');
  };

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;
    console.log('Registering socket event listeners...');

    const handleIncomingCall = ({ from, offer, callId }) => {
      console.log('📞 Incoming call from:', from, 'Offer:', offer);
      setIncomingCall({ from, offer, callId });
    };

    const handleCallAccepted = async ({ answer, callId }) => {
      console.log('✅ Call accepted by remote peer. Answer:', answer);
      if (peerRef.current) {
        console.log('Setting remote description with answer:', answer);
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        
        // Process any queued ICE candidates
        console.log('Processing queued ICE candidates after answer:', iceCandidatesQueue.current.length);
        while (iceCandidatesQueue.current.length > 0) {
          const candidate = iceCandidatesQueue.current.shift();
          try {
            await peerRef.current.addIceCandidate(candidate);
            console.log('Added queued ICE candidate after answer:', candidate);
          } catch (e) {
            console.error('Error adding queued ICE candidate after answer:', e);
          }
        }
      }
      toast.success('Call connected');
    };

    const handleCallDeclined = () => {
      console.log('❌ Call declined by remote peer');
      toast.error('Call was declined');
      cleanupCall();
      setIsInCall(false);
    };

    const handleCallEnded = ({ reason }) => {
      console.log('📴 Call ended:', reason || 'By user');
      cleanupCall();
      setIsInCall(false);
      setIncomingCall(null);
      toast.info(reason || 'Call ended');
    };

    const handleIceCandidate = async ({ candidate, from, callId }) => {
      console.log('🧊 Received ICE candidate from:', from, 'Candidate:', candidate);
      
      if (peerRef.current && peerRef.current.remoteDescription) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('Added received ICE candidate to peer connection.');
        } catch (e) {
          console.error('Error adding received ICE candidate:', e);
        }
      } else {
        // Queue the candidate if remote description is not set yet
        console.log('Queueing ICE candidate as remote description not set.');
        iceCandidatesQueue.current.push(new RTCIceCandidate(candidate));
      }
    };

    const handleCallError = ({ message }) => {
      console.error('❌ Call error:', message);
      toast.error(message);
      cleanupCall();
      setIsInCall(false);
    };

    // Register event listeners
    socket.on('incomingCall', handleIncomingCall);
    socket.on('callAccepted', handleCallAccepted);
    socket.on('callDeclined', handleCallDeclined);
    socket.on('callEnded', handleCallEnded);
    socket.on('iceCandidate', handleIceCandidate);
    socket.on('callError', handleCallError);

    return () => {
      console.log('Unregistering socket event listeners...');
      socket.off('incomingCall', handleIncomingCall);
      socket.off('callAccepted', handleCallAccepted);
      socket.off('callDeclined', handleCallDeclined);
      socket.off('callEnded', handleCallEnded);
      socket.off('iceCandidate', handleIceCandidate);
      socket.off('callError', handleCallError);
    };
  }, [socket, selectedUser, callId]); // Added callId to dependencies for socket events

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up call...');
      cleanupCall();
    };
  }, []);

  return {
    incomingCall,
    localStream,
    remoteStream,
    isInCall,
    connectionState,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    declineCall,
    endCall
  };
};

const ChatContainer = () => {
  const { messagesMap, selectedUser, setSelectedUser, sendMessage, getMessages } = useContext(ChatContext);
  const { authUser, onlineUsers, socket } = useContext(Authcontext);
  const scrollEnd = useRef();
  const [input, setInput] = useState('');

  // Use video call hook
  const {
    incomingCall,
    localStream,
    remoteStream,
    isInCall,
    connectionState,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    declineCall,
    endCall
  } = useVideoCall(socket, authUser, selectedUser);

  // Chat logic
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;
    await sendMessage({ text: input.trim() });
    setInput('');
  };

  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error('select an image file');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (scrollEnd.current && messagesMap[selectedUser?._id]) {
      scrollEnd.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesMap, selectedUser]);

  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 text-gray-500 max-md:hidden relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        {/* Glass Effect Overlay */}
        <div className="absolute inset-0 backdrop-blur-xl bg-white/5 border-r border-white/10"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative group">
            <img 
              src={assets.logo_icon} 
              alt="" 
              className="max-w-20 transition-transform duration-300 group-hover:scale-110 drop-shadow-2xl" 
            />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-purple-200 to-blue-200 bg-clip-text transparent">
              Chat anytime, anywhere
            </p>
            <p className="text-gray-300 text-sm opacity-80">
              Select a conversation to start messaging
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-pink-900/30">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      {/* Glass Effect Overlay */}
      <div className="absolute inset-0 backdrop-blur-xl bg-white/5 border-r border-white/10"></div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 py-2 px-4 border-b h-14 border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="relative">
            <img 
              src={selectedUser.profilePic || assets.avatar_icon} 
              alt="" 
              className="w-10 h-10 rounded-full border-2 border-white/20 shadow-lg transition-transform duration-300 hover:scale-105" 
            />
            {onlineUsers.includes(selectedUser._id) && (
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white shadow-lg animate-pulse"></span>
            )}
          </div>

          <div className="flex-1">
            <p className="text-base font-semibold text-white">
              {selectedUser.fullName}
            </p>
            <p className="text-xs text-gray-300">
              {onlineUsers.includes(selectedUser._id) ? 'Online' : 'Offline'}
              {connectionState !== 'disconnected' && (
                <span className="ml-2 text-green-400">• {connectionState}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={startCall} 
              disabled={!onlineUsers.includes(selectedUser._id) || isInCall}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {isInCall ? 'In Call' : 'Call'}
            </button>

            <img 
              src={assets.arrow_icon} 
              alt="" 
              className="md:hidden w-7 h-7 cursor-pointer hover:bg-white/10 rounded-md p-1 transition-colors duration-200" 
              onClick={() => setSelectedUser(null)} 
            />
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
          {messagesMap[selectedUser._id]?.map((msg, index) => (
            <div
              key={index}
              className={`flex items-end gap-2 ${msg.senderId === authUser._id ? 'justify-end' : 'justify-start'}`}
            >
              {msg.senderId !== authUser._id && (
                <div className="flex flex-col items-center">
                  <img
                    src={selectedUser?.profilePic || assets.avatar_icon}
                    alt=""
                    className="w-8 h-8 rounded-full border border-white/20 shadow-sm"
                  />
                </div>
              )}
              
              <div className="max-w-xs lg:max-w-md">
                {msg.image ? (
                  <div className="relative group">
                    <img
                      src={msg.image}
                      alt=""
                      className="rounded-xl shadow-lg border border-white/20 transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                ) : (
                  <div className={`p-4 rounded-2xl backdrop-blur-sm shadow-lg border transition-all duration-300 hover:shadow-xl ${
                    msg.senderId === authUser._id
                      ? 'bg-gradient-to-r from-purple-500/80 to-blue-500/80 text-white border-white/20 rounded-br-md'
                      : 'bg-white/10 text-white border-white/20 rounded-bl-md'
                  }`}>
                    <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                  </div>
                )}
                
                <div className={`flex items-center gap-2 mt-0.5 ${
                  msg.senderId === authUser._id ? 'justify-end' : 'justify-start'
                }`}>
                  <p className="text-xs text-gray-400">{formatMessageTime(msg.createdAt)}</p>
                </div>
              </div>
              
              {msg.senderId === authUser._id && (
                <div className="flex flex-col items-center">
                  <img
                    src={authUser?.profilePic || assets.avatar_icon}
                    alt=""
                    className="w-8 h-8 rounded-full border border-white/20 shadow-sm"
                  />
                </div>
              )}
            </div>
          ))}
          <div ref={scrollEnd}></div>
        </div>

        {/* Input Area */}
        <div className="p-1 border-t border-white/10 bg-white/5 backdrop-blur-sm h-14">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-md hover:shadow-lg transition-all duration-300 focus-within:border-purple-400/50 focus-within:shadow-purple-500/20">
                <div className="flex items-center px-3 py-2">
                  <input
                    onChange={(e) => setInput(e.target.value)}
                    value={input}
                    onKeyDown={(e) => (e.key === 'Enter' ? handleSendMessage(e) : null)}
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-sm"
                  />
                  
                  <input 
                    onChange={handleSendImage} 
                    type="file" 
                    id="image" 
                    accept="image/png,image/jpeg" 
                    hidden 
                  />
                  <label htmlFor="image" className="cursor-pointer">
                    <img 
                      src={assets.gallery_icon} 
                      alt="" 
                      className="w-5 h-5 hover:scale-110 transition-transform duration-200 opacity-70 hover:opacity-100" 
                    />
                  </label>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSendMessage}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 p-2.5 rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 group"
            >
              <img 
                src={assets.send_button} 
                alt="" 
                className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" 
              />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
          
          {/* Modal */}
          <div className="relative z-10 bg-white/10 backdrop-blur-xl rounded-3xl p-8 w-96 text-center shadow-2xl border border-white/20">
            {/* Animated Ring */}
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse"></div>
              <div className="absolute inset-1 rounded-full bg-white/10 backdrop-blur-sm"></div>
              <img
                src={selectedUser?.profilePic || assets.avatar_icon}
                alt="caller"
                className="absolute inset-2 w-20 h-20 object-cover rounded-full"
              />
            </div>

            {/* Call Info */}
            <div className="mb-8">
              <p className="text-2xl font-bold text-white mb-2">
                Incoming Video Call
              </p>
              <p className="text-gray-300 text-lg">
                {selectedUser?.fullName || 'Unknown Caller'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-6">
              <button
                onClick={acceptCall}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Accept
              </button>
              
              <button
                onClick={declineCall}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l18 18" />
                </svg>
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Video Call Interface */}
      {isInCall && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="relative w-full max-w-6xl h-[90vh] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
            {/* Remote Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Connection Status */}
            {connectionState !== 'connected' && (
              <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
                {connectionState === 'connecting' && '🔄 Connecting...'}
                {connectionState === 'failed' && '❌ Connection Failed'}
                {connectionState === 'disconnected' && '📡 Reconnecting...'}
              </div>
            )}

            {/* Local Video (Picture-in-Picture) */}
            <div className="absolute bottom-6 right-6 w-48 h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 bg-gray-800">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>

            {/* Call Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
              <button
                onClick={endCall}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l18 18" />
                </svg>
                End Call
              </button>
            </div>

            {/* No Remote Stream Message */}
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-lg">Waiting for {selectedUser?.fullName} to join...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
