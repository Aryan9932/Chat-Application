import React, { useContext, useState } from 'react'
import {useNavigate} from 'react-router-dom'
import assets from '../assets/assets';
import { Authcontext } from '../../context/AuthContext';

const ProfilePage = () => {
  const {authUser,updateProfile} = useContext(Authcontext)

  const[selectedImg,setSelectedImg]= useState(null)
  const navigate = useNavigate();
  const [name,setName] = useState(authUser.fullName);
  const [bio,setBio] = useState(authUser.bio)

  const handleSubmit=async(e)=>{
    e.preventDefault();
    if(!selectedImg){
      await updateProfile({fullName:name,bio});
      navigate('/');
      return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(selectedImg);
    reader.onload = async ()=>{
      const base64Image=reader.result;
      await updateProfile({profilePic:base64Image,fullName:name,bio})
      navigate('/');
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center relative overflow-hidden'>
      {/* Background decorative elements matching login page */}
      <div className='absolute inset-0 bg-black/20'></div>
      <div className='absolute top-0 left-0 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl'></div>
      <div className='absolute bottom-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl'></div>
      
      <div className='w-5/6 max-w-4xl backdrop-blur-xl bg-white/10 border border-white/20 flex items-center justify-between max-sm:flex-col-reverse rounded-2xl shadow-2xl relative z-10 overflow-hidden'>
        
        {/* Subtle inner glow effect */}
        <div className='absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none'></div>
        
        <form onSubmit={handleSubmit} className='flex flex-col gap-6 p-10 flex-1 relative z-10'>
          <div className='mb-4'>
            <h3 className='text-3xl font-bold text-white mb-2'>Profile Details</h3>
            <p className='text-white/70'>Update your profile information</p>
          </div>
          
          <label htmlFor="avatar" className='flex items-center gap-4 cursor-pointer group'>
            <input 
              onChange={(e)=>setSelectedImg(e.target.files[0])} 
              type="file" 
              id='avatar'
              accept='.png, .jpg, .jpeg' 
              hidden 
            />
            <div className='relative'>
              <img 
                src={selectedImg ? URL.createObjectURL(selectedImg) : assets.avatar_icon} 
                className={`w-16 h-16 object-cover border-2 border-white/30 group-hover:border-purple-400 transition-all duration-200 ${selectedImg ? 'rounded-full' : 'rounded-lg'}`}
                alt="Profile"
              />
              <div className='absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
                <svg className='w-6 h-6 text-white' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
            <div className='flex flex-col'>
              <span className='text-white font-medium group-hover:text-purple-300 transition-colors duration-200'>
                Upload Profile Image
              </span>
              <span className='text-white/60 text-sm'>PNG, JPG or JPEG</span>
            </div>
          </label>
          
          <input 
            onChange={(e)=>setName(e.target.value)} 
            value={name}
            type="text" 
            required 
            placeholder='Your name' 
            className='p-4 bg-white/10 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-white/50 backdrop-blur-sm hover:bg-white/15 transition-all duration-200' 
          />
          
          <textarea 
            onChange={(e)=>setBio(e.target.value)} 
            value={bio}
            placeholder='Write your bio...'
            className='p-4 bg-white/10 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-white/50 backdrop-blur-sm hover:bg-white/15 transition-all duration-200 resize-none' 
            rows={4} 
            required
          />

          <button 
            type='submit' 
            className='py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl'
          >
            Save Changes
          </button>
          
          <button 
            type='button' 
            onClick={() => navigate('/')}
            className='py-3 bg-white/10 border border-white/30 text-white rounded-xl font-medium hover:bg-white/20 transition-all duration-200'
          >
            Cancel
          </button>
        </form>
        
        <div className='flex flex-col items-center mx-10 max-sm:mt-10 relative z-10'>
          <div className='relative group'>
            <img 
              className={`w-44 h-44 object-cover border-4 border-white/30 shadow-2xl group-hover:border-purple-400 transition-all duration-300 ${selectedImg || authUser?.profilePic ? 'rounded-full' : 'rounded-2xl'}`} 
              src={selectedImg ? URL.createObjectURL(selectedImg) : (authUser?.profilePic || assets.logo_icon)} 
              alt="Profile Preview" 
            />
            <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
          </div>
          <div className='mt-6 text-center'>
            <h4 className='text-xl font-semibold text-white'>{name || 'Your Name'}</h4>
            <p className='text-white/70 mt-2 max-w-xs'>{bio || 'Your bio will appear here'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage