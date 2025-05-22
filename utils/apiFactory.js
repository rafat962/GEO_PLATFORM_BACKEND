const handle = require('./handleAsync')
const ApiFeature = require('./apiFeature')






//------------------- Get All Tours -------------------
exports.getAll = model => handle(async (req,res,next)=>{
    const finalObj =  new ApiFeature(model.find(),req.query).filter().field().sort().paginate()
    const document = await finalObj.tour
    return {
        totleResult:document.length,
        document
    }
})
//------------------- Get one Tour -------------------
exports.getOne = (model,type) => handle(async (req,res,next)=>{
        let document;
        if(type ==='tour'){
            document = await model.findById(req.params.id).populate({
                path:'reviews',
                select:'rating review'
            })
        }else if (type ==='review'){
            document = await model.findById(req.params.id).populate(['user','tour'])
        }else{
            document = await model.findById(req.params.id)
        }
        return{
            document
        }
})
//------------------- Create Tour -------------------
exports.createNew = model => handle(async (req,res,next)=>{
    const document = await model.create(req.body)
    return {        
        document
    }
})
//------------------- Delete Tour -------------------
exports.delete = model => handle(async (req,res,next)=>{
    const document = await model.findByIdAndDelete(req.params.id)
    return {
        document
    }
})
//------------------- Update Tour -------------------
exports.update = model => handle(async (req,res,next)=>{
    const document = await model.findByIdAndUpdate(req.params.id,req.body,{
        new:true,
        runValidators:true
    })
    return {
        document
    }
})