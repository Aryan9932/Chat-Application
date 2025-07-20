import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { Authcontext } from '../../context/AuthContext'
import { ChatContext } from '../../context/ChatContext'

const SideBar = () => {
  const{getUsers,users,selectedUser,setSelectedUser,unseenMessages,setUnseenMessages}=useContext(ChatContext);

  const{logout,onlineUsers}=useContext(Authcontext)

  const[input,setInput]=useState(false)
  const[showDropdown,setShowDropdown]=useState(false) // Add state for dropdown visibility

  const navigate = useNavigate();

  const filteredUsers=input ? users.filter((user)=>user.fullName.toLowerCase().includes(input.toLowerCase())) :   users

  useEffect(()=>{
    getUsers();
  },[onlineUsers])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown-container')) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showDropdown])

  const handleProfileClick = () => {
    setShowDropdown(false)
    navigate('/profile')
  }

  const handleLogoutClick = () => {
    setShowDropdown(false)
    logout()
  }

  return (
    <div className={`bg-gradient-to-b from-white/10 to-white/5 h-full p-5 backdrop-blur-sm border-r border-white/20 overflow-y-scroll text-white ${selectedUser ? "max-md:hidden" : ''}`}>
      
      {/* Header Section */}
      <div className='pb-6 border-b border-white/20'>
        <div className='flex justify-between items-center'>
          <img src={assets.logo} alt="logo" className='max-w-40 drop-shadow-lg' />
          <div className='relative py-2 dropdown-container'>
            <div 
              onClick={() => setShowDropdown(!showDropdown)}
              className='w-10 h-10 rounded-full bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all duration-200 backdrop-blur-sm'
            >
              <img src={assets.menu_icon} alt="Menu" className='max-h-5 filter brightness-0 invert' />
            </div>
            <div className={`absolute top-full right-0 z-20 w-40 p-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-2xl transition-all duration-200 ${showDropdown ? 'block opacity-100 transform translate-y-0' : 'hidden opacity-0 transform -translate-y-2'}`}>
              <p onClick={handleProfileClick} className='cursor-pointer text-sm py-2 px-3 rounded-lg hover:bg-white/20 transition-all duration-200 flex items-center gap-2'>
                <svg className='w-4 h-4' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Edit Profile
              </p>
              <hr className='my-2 border-t border-white/20' />
              <p onClick={handleLogoutClick} className='cursor-pointer text-sm py-2 px-3 rounded-lg hover:bg-red-500/20 transition-all duration-200 flex items-center gap-2 text-red-300'>
                <svg className='w-4 h-4' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </p>
            </div>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className='bg-white/10 backdrop-blur-sm rounded-xl flex items-center gap-3 py-3 px-4 mt-5 border border-white/20 hover:bg-white/15 transition-all duration-200 focus-within:ring-2 focus-within:ring-purple-400/50'>
          <svg className='w-4 h-4 text-white/70' fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            onChange={(e)=>setInput(e.target.value)} 
            type='text' 
            className='bg-transparent border-none outline-none text-white text-sm placeholder-white/50 flex-1' 
            placeholder='Search users...'
          />
        </div>
      </div>

      {/* Users List */}
      <div className='flex flex-col mt-4 space-y-2'>
        {filteredUsers.map((user,index)=>(
          <div 
            onClick={()=>{setSelectedUser(user),setUnseenMessages(prev=>({...prev,[user._id]:''}))}} 
            key={index}  
            className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/15 group ${selectedUser?._id=== user._id ? 'bg-white/20 border border-white/30' : 'hover:bg-white/10'}`}
          >
            <div className='relative'>
              <img 
                src={user?.profilePic || assets.avatar_icon} 
                alt=""  
                className='w-12 h-12 rounded-full object-cover border-2 border-white/30 group-hover:border-white/50 transition-all duration-200'
              />
              {/* Online Status Indicator */}
              {onlineUsers.includes(user._id) && (
                <div className='absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white/90 shadow-lg'></div>
              )}
            </div>
            
            <div className='flex flex-col leading-5 flex-1 min-w-0'>
              <p className='text-white font-medium truncate'>{user.fullName}</p>
              {onlineUsers.includes(user._id) ? (
                <span className='text-green-400 text-xs font-medium flex items-center gap-1'>
                  <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
                  Online
                </span>
              ) : (
                <span className='text-white/60 text-xs'>Offline</span>
              )}
            </div>
            
            {/* Unseen Messages Badge */}
            {unseenMessages[user._id] && (
              <div className='absolute top-2 right-2 h-6 w-6 flex justify-center items-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow-lg animate-pulse'>
                {unseenMessages[user._id]}
              </div>
            )}
          </div>
        ))}
        
        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <svg className='w-12 h-12 text-white/30 mb-4' fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className='text-white/60 text-sm'>No users found</p>
            <p className='text-white/40 text-xs mt-1'>Try adjusting your search</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SideBar