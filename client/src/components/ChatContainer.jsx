import React, { useContext, useState, useEffect, useRef } from 'react';
import assets from '../assets/assets';
import { formatMessageTime } from '../lib/utils';
import { ChatContext } from '../../context/ChatContext';
import { Authcontext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ChatContainer = () => {
  const { messagesMap, selectedUser, setSelectedUser, sendMessage, onlineUsers, socket } = useContext(ChatContext);
  const { currentUser } = useContext(Authcontext);

  const [message, setMessage] = useState('');
  const [call, setCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);

  const peerConnection = useRef(null);
  const pendingCandidates = useRef([]); // ✅ FIX: store incoming ICE candidates until remote description is ready

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  const startCall = async () => {
    if (!selectedUser) return;
    setIsCalling(true);

    peerConnection.current = createPeerConnection();

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);
    stream.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, stream);
    });

    localVideoRef.current.srcObject = stream;

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit('callUser', {
      to: selectedUser._id,
      from: currentUser._id,
      offer,
    });
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('iceCandidate', {
          to: selectedUser?._id || call?.from,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    return pc;
  };

  const answerCall = async () => {
    if (!call) return;

    setIsCallActive(true);

    peerConnection.current = createPeerConnection();

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);
    stream.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, stream);
    });

    localVideoRef.current.srcObject = stream;

    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(call.offer));

    // ✅ FIX: flush any queued ICE candidates
    for (const candidate of pendingCandidates.current) {
      await peerConnection.current.addIceCandidate(candidate);
    }
    pendingCandidates.current = [];

    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);

    socket.emit('answerCall', {
      to: call.from,
      answer,
    });

    setCall(null);
  };

  const endCall = () => {
    peerConnection.current?.close();
    peerConnection.current = null;
    setIsCallActive(false);
    setIsCalling(false);
    setCall(null);
    setLocalStream(null);
    setRemoteStream(null);

    socket.emit('endCall', {
      to: selectedUser?._id || call?.from,
    });
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('incomingCall', ({ from, offer }) => {
      setCall({ from, offer });
    });

    socket.on('callAccepted', async ({ answer }) => {
      setIsCalling(false);
      setIsCallActive(true);
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));

      // ✅ FIX: flush any queued ICE candidates
      for (const candidate of pendingCandidates.current) {
        await peerConnection.current.addIceCandidate(candidate);
      }
      pendingCandidates.current = [];
    });

    socket.on('callEnded', () => {
      endCall();
    });

    socket.on('iceCandidate', async ({ candidate }) => {
      const iceCandidate = new RTCIceCandidate(candidate);
      if (peerConnection.current?.remoteDescription?.type) {
        await peerConnection.current.addIceCandidate(iceCandidate);
      } else {
        // ✅ FIX: queue ICE candidates until remote description is ready
        pendingCandidates.current.push(iceCandidate);
      }
    });

    return () => {
      socket.off('incomingCall');
      socket.off('callAccepted');
      socket.off('callEnded');
      socket.off('iceCandidate');
    };
  }, [socket]);

  return (
    <div className="chat-container">
      <div className="chat-header">
        {selectedUser && (
          <>
            <img src={selectedUser.profilePic} alt="" />
            <div>
              <h3>{selectedUser.fullname}</h3>
              <p>{onlineUsers.includes(selectedUser._id) ? 'Online' : 'Offline'}</p>
            </div>
            <img
              src={assets.videoIcon}
              onClick={startCall}
              style={{ cursor: 'pointer', marginLeft: 'auto' }}
            />
          </>
        )}
      </div>

      <div className="message-container">
        {messagesMap[selectedUser?._id]?.map((msg, i) => (
          <div className={`message ${msg.sender === currentUser._id ? 'sent' : 'received'}`} key={i}>
            <p>{msg.text}</p>
            <span>{formatMessageTime(msg.createdAt)}</span>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <img src={assets.sendIcon} onClick={handleSendMessage} />
      </div>

      {/* Video call UI */}
      {(isCalling || isCallActive || call) && (
        <div className="video-call-container">
          <video ref={localVideoRef} autoPlay muted playsInline />
          <video ref={remoteVideoRef} autoPlay playsInline />

          {!isCallActive && call && (
            <div>
              <button onClick={answerCall}>Accept</button>
              <button onClick={endCall}>Decline</button>
            </div>
          )}

          {(isCallActive || isCalling) && <button onClick={endCall}>End Call</button>}
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
