


// -------------------- handle function --------------------

const handle = (asyncFunction) => {
    return async (req,res,next)=>{
        try{
            const result = await asyncFunction(req,res,next)
            res.status(200).json({
                status:'success',
                data:result
            })
        }catch(err){
            res.status(404).json({
                status:'fail',
                message:err.message
            })
        }
    }
}


// exports.func = handle(async (req,res,next)=>{
//     ------------logic
//     return {
//        ---------data
//     }
// })




module.exports = handle