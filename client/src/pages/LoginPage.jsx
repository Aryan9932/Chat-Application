import React, { useContext, useState } from 'react'
import assets from '../assets/assets'
import { Authcontext } from '../../context/AuthContext'

const LoginPage = () => {

  const[currState,setCurrState]=useState("Sign up");
  const[fullName,setFullName]=useState("");
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[bio,setBio]=useState("");
  const[isDataSubmitted,setIsDataSubmitted]=useState(false);
  const {login} = useContext(Authcontext);

  const onSubmitHandler=(event)=>{
     event.preventDefault();

     if(currState==='Sign up' && !isDataSubmitted){
      setIsDataSubmitted(true)
      return;
     }
     login(currState==='Sign up' ? 'signup':'login',{fullName,email,password,bio})
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col relative overflow-hidden'>
      {/* Background decorative elements */}
      <div className='absolute inset-0 bg-black/20'></div>
      <div className='absolute top-0 left-0 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl'></div>
      <div className='absolute bottom-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl'></div>
      
      {/*---------left----------*/}
      <div className='relative z-10 flex flex-col items-center'>
        <img src={assets.logo_big1} alt="" className='w-[min(30vw,280px)] drop-shadow-2xl hover:scale-105 transition-transform duration-300' />
        <div className='mt-6 text-center'>
          <h1 className='text-4xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text transparent'>
            Welcome Back
          </h1>
          <p className='text-white/70 text-lg'>Connect with friends and start chatting</p>
        </div>
      </div>

      {/*--------right----------*/}
      <div className='relative z-10'>
        <form onSubmit={onSubmitHandler} className='backdrop-blur-xl bg-white/10 border border-white/20 p-8 flex flex-col gap-6 rounded-2xl shadow-2xl w-full max-w-md hover:bg-white/15 transition-all duration-300'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='font-bold text-3xl text-white'>{currState}</h2>
            {isDataSubmitted && (
              <div 
                onClick={()=>setIsDataSubmitted(false)}
                className='w-10 h-10 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors duration-200'
              >
                <img src={assets.arrow_icon} alt="" className='w-5 filter invert'/>
              </div>
            )}
          </div>

          {currState==="Sign up"&& !isDataSubmitted &&(
             <input 
               onChange={(e)=>setFullName(e.target.value)} 
               value={fullName}
               type="text" 
               className='p-4 bg-white/10 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-white/50 backdrop-blur-sm hover:bg-white/15 transition-all duration-200'
               placeholder='Full Name' 
               required
             />
          )} 

          {!isDataSubmitted &&(
            <>
            <input 
              onChange={(e)=>setEmail(e.target.value)} 
              value={email}
              type="email" 
              placeholder='Email Address' 
              required 
              className='p-4 bg-white/10 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-white/50 backdrop-blur-sm hover:bg-white/15 transition-all duration-200'
            />

            <input 
              onChange={(e)=>setPassword(e.target.value)} 
              value={password}
              type="password" 
              placeholder='Password' 
              required 
              className='p-4 bg-white/10 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-white/50 backdrop-blur-sm hover:bg-white/15 transition-all duration-200'
            />
            </>
          )}

          {
           currState==='Sign up' && isDataSubmitted &&(
            <textarea 
              onChange={(e)=>setBio(e.target.value)} 
              value={bio} 
              rows={4} 
              className='p-4 bg-white/10 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-white/50 backdrop-blur-sm hover:bg-white/15 transition-all duration-200 resize-none' 
              placeholder='Tell us about yourself...' 
              required 
            />
           ) 
          }

          <button 
            type='submit' 
            className='py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl'
          >
            {currState==="Sign up" ? "Create Account":"Login Now"}
          </button>

          <div className='flex items-center gap-3 text-sm text-white/70'>
             <input 
               type="checkbox" 
               className='w-4 h-4 rounded border-white/30 bg-white/10 cursor-pointer accent-purple-500' 
             />
             <p>I agree to the terms of use & privacy policy.</p>
          </div>
          
          <div className='flex flex-col gap-2 pt-4 border-t border-white/20'>
            {currState==='Sign up'? (
              <p className='text-sm text-white/70 text-center'>
                Already have an account? 
                <span 
                  onClick={()=>{setCurrState("Login"); setIsDataSubmitted(false)}}
                  className='font-semibold text-purple-300 cursor-pointer hover:text-purple-200 transition-colors duration-200 ml-1'
                >
                  Login here
                </span>
              </p>
            ):(
              <p className='text-sm text-white/70 text-center'>
                Don't have an account? 
                <span
                  onClick={()=>setCurrState("Sign up")}
                  className='font-semibold text-purple-300 cursor-pointer hover:text-purple-200 transition-colors duration-200 ml-1'
                >
                  Sign up here
                </span>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage












