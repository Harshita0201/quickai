import { Sparkles, Edit, Eraser, Scissors } from 'lucide-react'
import React, {useState} from 'react'
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';


axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const RemoveObject = () => {
  const [input, setInput] = useState('');
  const [object, setObject] = useState('');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');//response from backend will be stored here
    
  const {getToken} = useAuth();

  const onSubmitHandler = async (e) =>{
    e.preventDefault(); //prevent page reload, on submit of form
    try {
      setLoading(true);

      if(object.split(' ').length>1){
        return toast.error('Please provide only one object name');
      }
      const formData = new FormData();
      formData.append('image', input);
      formData.append('object', object);

      const {data} = await axios.post('/api/ai/remove-image-object', formData, 
       {headers: {Authorization: `Bearer ${await getToken()}` }})
      
       if(data.success){
         setContent(data.imageUrl); 
       }else{
        toast.error(data.message);
       }
      
    } catch (error) {
       toast.error(error.message);
    }
    setLoading(false);
  }
  return (
    <div>
       <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
          {/* left column- input form  */}
          <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200'>
              <div className='flex items-center gap-3'>
                <Sparkles className='w-6 text-[#4A7AFF]'/>
                <h1 className='text-xl font-semibold'>Object Removal</h1>
              </div>
              <p className='mt-6 text-sm font-medium'>Upload Image</p>
              
              <input
                 type="file"
                 accept="image/*"
                 onChange={(e) => setInput(e.target.files[0])}
                 required
                 className="
                   w-full mt-2 text-sm text-gray-600 cursor-pointer
                   border border-gray-300 rounded-md p-1.5
               
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-md file:border-0
                   file:text-sm file:font-semibold
                   file:text-white
                   file:bg-gradient-to-r file:from-purple-500 file:to-blue-500
                   hover:file:brightness-110
                 "
              />

              <p className='mt-6 text-sm font-medium'>Describe the object to be removed from the image</p>
              <textarea onChange={(e)=>setObject(e.target.value)} value={object} rows={4} className='w-full p-2 px-3 mt-4 outline-none text-sm-rounded-md border border-gray-300' placeholder='eg. watch, spoon, tree. Only single object name accepted' required/>
              <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#417DF6] to-[#8E37EB] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer'>
                {loading ? <span className='w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin'></span>:<Scissors className='w-5'/> }
                Remove Object
              </button>
          </form>

          {/* right column, - output moved inside the flex container so it sits beside the form */}
          <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96'>
                <div className='flex items-center gap-3'>
                  <Scissors className='w-5 h-5 text-[#4A7AFF]'/>
                  <h1 className='text-xl font-semibold'>Processed Image</h1>
                </div>
                {!content ? ( <div className='flex-1 flex justify-center items-center'>
                   <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
                      <Scissors className='w-9 h-9'/>
                      <p>Upload an image and click "Remove Object" to get started.</p>
                   </div>
                </div>): (
                    <img src={content} alt="image" className='mt-3 w-full h-full'/>
                )}
               
          </div>

       </div>
    </div>
  )
}

export default RemoveObject
