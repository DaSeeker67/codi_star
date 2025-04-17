const asyncHandler = (resquestHandler) =>{
    return  (req,res,next) => {
          Promise.resolve(resquestHandler(req,res,next))
          .catch((err)=>next(err))
      }
  }
  
  export {asyncHandler}