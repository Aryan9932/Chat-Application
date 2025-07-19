import { createContext,useContext, useEffect, useState } from "react";
import { Authcontext } from "./AuthContext";
import { toast } from "react-hot-toast";


export const ChatContext= createContext();

export const ChatProvider=({children})=>{

    const [messagesMap, setMessagesMap] = useState({}); // userId => [messages]

    const [users,setUsers]=useState([]);
    const [selectedUser,setSelectedUser]=useState(null);
    const [unseenMessages,setUnseenMessages]=useState({});

    const {socket,axios}= useContext(Authcontext);

    //function to get all users for sidebar

    const getUsers =async()=>{
        try {
          const{data} = await axios.get("/api/messages/users");
            if(data.success){
                setUsers(data.users)
                setUnseenMessages(data.unseenMessages)
                
            }
        } catch (error) {
            toast.error(error.message)
        }
    }



    /// the changes 01
    const [onlineUsers, setOnlineUsers] = useState([]);

    // This goes below the useEffect for newMessage subscription
useEffect(() => {
    if (!socket) return;

    const handleOnlineUsers = (onlineIds) => {
        // You need to store online users somewhere – let's add state for that
        setOnlineUsers(onlineIds);
    };

    socket.on("getOnlineUsers", handleOnlineUsers);

    return () => {
        socket.off("getOnlineUsers", handleOnlineUsers);
    };
}, [socket]);
//changes over


//function to get messages for selected users
const getMessages =async (userId)=>{
    try {
      const {data} = await axios.get(`/api/messages/${userId}`);
      if(data.success){//cahnnes 2
         setMessagesMap(prev => ({
                ...prev,
                [userId]: data.messages
            }));
        }
    } catch (error) {
         toast.error(error.message)
        }
    }

//function to  send message to selected user
    const sendMessage = async(messageData)=>{
        try {
            const {data}=await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
           if (data.success) {//cahnges
    setMessagesMap(prev => ({
        ...prev,
        [selectedUser._id]: [...(prev[selectedUser._id] || []), data.newMessage]
    }));
}
            else{
              toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    //function to subscribe to messages for selected user

    const subscribeToMessages =async ()=>{
        if(!socket) return;//chnnages
        socket.on("newMessage", (newMessage) => {
    const senderId = newMessage.senderId;

    // If current chat is with the sender
    if (selectedUser && senderId === selectedUser._id) {
        newMessage.seen = true;
        setMessagesMap(prev => ({
            ...prev,
            [senderId]: [...(prev[senderId] || []), newMessage]
        }));
        axios.put(`/api/messages/marks/${newMessage._id}`);
    } else {
        // Update unseen count and store message
        setUnseenMessages(prev => ({
            ...prev,
            [senderId]: prev[senderId] ? prev[senderId] + 1 : 1
        }));

        setMessagesMap(prev => ({
            ...prev,
            [senderId]: [...(prev[senderId] || []), newMessage]
        }));
    }
});
    }

//function  to unsubscribe from messages

    const unsubscribeFromMessages=()=>{
        if(socket) socket.off("newMessage");
    }
    useEffect(()=>{
        subscribeToMessages();
        return()=>{
            unsubscribeFromMessages();
        }
    },[socket,selectedUser]);

    const value={
        messagesMap,users,selectedUser,getUsers,getMessages,sendMessage,setSelectedUser,unseenMessages,setUnseenMessages,onlineUsers

    }

    return(
    <ChatContext.Provider value={value}>
           {children}

    </ChatContext.Provider>)
}