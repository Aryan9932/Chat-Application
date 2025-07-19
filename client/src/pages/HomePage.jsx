import React, { useContext, useState } from 'react'
import SideBar from '../components/SideBar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import { ChatContext } from '../../context/ChatContext'

const HomePage = () => {
  const { selectedUser, loading } = useContext(ChatContext)

  // Loading state
  if (loading) {
    return (
      <div className='w-full h-screen sm:px-[15%] sm:py-[5%] bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden'>
        {/* Background decorative elements */}
        <div className='absolute inset-0 bg-black/20'></div>
        <div className='absolute top-0 left-0 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl'></div>
        <div className='absolute bottom-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl'></div>
        
        <div className='backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden h-[100%] flex items-center justify-center relative shadow-2xl'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4'></div>
            <p className='text-white/70 text-lg'>Loading your chats...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='w-full h-screen sm:px-[15%] sm:py-[5%] bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden'>
      {/* Background decorative elements matching login page */}
      <div className='absolute inset-0 bg-black/20'></div>
      <div className='absolute top-0 left-0 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl'></div>
      <div className='absolute bottom-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl'></div>
      
      <div className={`backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden h-[100%] grid relative shadow-2xl ${
        selectedUser 
          ? 'grid-cols-1 md:grid-cols-[1fr_1.5fr] lg:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]' 
          : 'grid-cols-1 md:grid-cols-2'
      }`}>
        <SideBar />
        <ChatContainer />
        {/* Conditionally render RightSidebar only when user is selected and screen is large enough */}
        {selectedUser && (
          <RightSidebar className='hidden lg:block' />
        )}
      </div>
    </div>
  )
}

export default HomePage