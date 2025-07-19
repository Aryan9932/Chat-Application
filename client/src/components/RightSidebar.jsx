import React, { useContext, useEffect,useState } from 'react'
import { ChatContext } from '../../context/ChatContext'
import { Authcontext } from '../../context/AuthContext'
import assets from '../assets/assets'

const RightSidebar = () => {

  const {selectedUser,messagesMap} = useContext(ChatContext)
  const {logout,onlineUsers}=useContext(Authcontext)
  const [msgImages,setMsgImages]=useState([])

  //Get all the images from the messages and set them to state
useEffect(() => {
  if (selectedUser && messagesMap[selectedUser._id]) {
    const userMessages = messagesMap[selectedUser._id];
    const imageMessages = userMessages
      .filter(msg => msg.image)
      .map(msg => msg.image);
    setMsgImages(imageMessages);
  }
}, [selectedUser, messagesMap]);

  return  selectedUser && (
    <div className={`bg-gradient-to-b from-white/10 to-white/5 text-white w-full relative overflow-y-scroll backdrop-blur-sm border-l border-white/20 ${selectedUser ? "max-md:hidden ":""}`}>

      {/* Profile Section */}
      <div className='pt-8 pb-6 flex flex-col items-center gap-4 text-center px-6'>
        <div className='relative group'>
          <img 
            src={selectedUser?.profilePic || assets.avatar_icon} 
            alt=""  
            className='w-24 h-24 rounded-full object-cover border-4 border-white/30 shadow-2xl group-hover:border-white/50 transition-all duration-300'
          />
          {/* Online Status Indicator */}
          {onlineUsers.includes(selectedUser._id) && (
            <div className='absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center'>
              <div className='w-3 h-3 bg-green-400 rounded-full animate-pulse'></div>
            </div>
          )}
        </div>
        
        <div className='space-y-2'>
          <h1 className='text-2xl font-bold text-white flex items-center justify-center gap-2'>
            {selectedUser.fullName}
          </h1>
          <div className='flex items-center justify-center gap-2'>
            {onlineUsers.includes(selectedUser._id) ? (
              <span className='text-green-400 text-sm font-medium flex items-center gap-1'>
                <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
                Online
              </span>
            ) : (
              <span className='text-white/60 text-sm'>Offline</span>
            )}
          </div>
          {selectedUser.bio && (
            <p className='text-white/70 text-sm leading-relaxed max-w-xs mx-auto'>
              {selectedUser.bio}
            </p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className='mx-6 border-t border-white/20 mb-6'></div>

      {/* Media Section */}
      <div className='px-6 mb-6'>
        <div className='flex items-center gap-2 mb-4'>
          <svg className='w-5 h-5 text-white/70' fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className='text-white font-medium'>Shared Media</p>
          {msgImages.length > 0 && (
            <span className='text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full'>
              {msgImages.length}
            </span>
          )}
        </div>
        
        {msgImages.length > 0 ? (
          <div className='max-h-[300px] overflow-y-auto'>
            <div className='grid grid-cols-2 gap-3'>
              {msgImages.map((url,index)=>(
                <div 
                  key={index} 
                  onClick={()=>window.open(url)} 
                  className='cursor-pointer rounded-xl overflow-hidden bg-white/10 border border-white/20 hover:border-white/40 transition-all duration-200 aspect-square'
                >
                  <img 
                    src={url} 
                    alt="" 
                    className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <svg className='w-12 h-12 text-white/30 mb-3' fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className='text-white/60 text-sm'>No media shared yet</p>
          </div>
        )}
      </div>

      {/* Actions Section */}
      <div className='absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full px-6'>
        <button 
          onClick={()=>logout()} 
          className='w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2'
        >
          <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  )
}

export default RightSidebar