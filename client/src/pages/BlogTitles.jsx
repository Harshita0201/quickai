import React, { useState, useEffect } from 'react'
import axios from 'axios';
import Markdown from 'react-markdown';
import { Sparkles, Hash } from 'lucide-react'
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;
const BlogTitles = () => {
  const blogCategories =[ 'General', 'Technology', 'Health', 'Finance', 'Travel', 'Food', 'Lifestyle', 'Education', 'Entertainment', 'Business'];

  const [selectedCategory, setSelectedCategory] = useState(blogCategories[0]);                       
  const [input, setInput] = useState('');
  useEffect(() => { 
      setInput('');
  }, [selectedCategory]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');//response from backend will be stored here
  
  const {getToken} = useAuth();

  const onSubmitHandler = async (e) =>{
    e.preventDefault(); //prevent page reload, on submit of form
    try {
      setLoading(true);
      const prompt = `Generate a blog title about ${input} in the category of ${selectedCategory}.`;
      const {data} = await axios.post('/api/ai/generate-blog-title', {prompt}, 
       {headers: {Authorization: `Bearer ${await getToken()}` }})
      
       if(data.success){
         setContent(data.content);
       }else{
          toast.error(data.message);
       }
    } catch (error) {
       toast.error(data.message);
    }
    setLoading(false);
  }

  return (
   <div>
       <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
          {/* left column- input form  */}
          <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200'>
              <div className='flex items-center gap-3'>
                <Sparkles className='w-6 text-[#8E37EB]'/>
                <h1 className='text-xl font-semibold'>AI Title Generator</h1>
              </div>
              <p className='mt-6 text-sm font-medium'>Keyword</p>
              <input onChange={(e)=>setInput(e.target.value)} value={input} type="text" className='w-full p-2 px-3 mt-2 outline-none text-sm-rounded-md border border-gray300' placeholder='The future of Artificial Intelligence is...' required/>
              <p className='mt-4 text-sm font-medium'>Title Cateogry</p>
              <div className='mt-3 flex gap-3 flex-wrap sm:max-w-9/11'>
                {blogCategories.map((item) => (
                  // <span  onClick={()=> setSelectedCategory(item) } className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${selectedCategory===item ? 'bg-purple-50 text-purple-700': 'text-gray-500 border-gray-300'}`} key={item}>{item}</span>
                  
                      <span
                        key={item}
                        onClick={() => {
                          console.log("clicked!");
                          
                          setSelectedCategory(item);
                          setInput(item);     
                          console.log("item set");      
                        }}
                        className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${selectedCategory === item
                            ? 'bg-purple-50 text-purple-700'
                            : 'text-gray-500 border-gray-300'
                          }`}
                      >
                        {item}
                      </span>
                    ))}
                
              </div>
              <br/>
              <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#C342F6] to-[#8E37EB] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer'>
                {loading ? <span className='w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin'></span>: <Hash className='w-5'/>}
                      Generate Title
              </button>
          </form>

          {/* right column, - output moved inside the flex container so it sits beside the form */}
          <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 h-96'>
            
                <div className='flex items-center gap-3'>
                  <Hash className='w-5 h-5 text-[#8E37EB]'/>
                  <h1 className='text-xl font-semibold'>Generated Titles</h1>
                </div>
                { !content ? (<div className='flex-1 flex justify-center items-center'>
                   <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
                      <Hash className='w-9 h-9'/>
                      <p>Enter a topic and click "Generate title" to get started.</p>
                   </div>
                </div>): ( //content exists
                    <div className='mt-3 flex-1 overflow-y-scroll text-sm text-slate-600'> 
                            <div className='reset-tw'> 
                            <Markdown>{content}</Markdown> 
                            </div>
                      </div>
                )}
          </div>
       </div>
    </div>
  )
}

export default BlogTitles
