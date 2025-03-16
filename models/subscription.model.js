import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Subscription name is required"],
        trim: true,
        minlenght: 2,
        maxlength: 1000,
    },
    description: {
        type: String,
        required: [true, "Subscription description is required"],
        trim: true,
        minlenght: 2,
        maxlength: 50,
    },
    price: {
        type: Number,
        required: [true, "Subscription price is required"],
        min: [0,'Price must be greater than 0']
    },
    currency:{
        type:String,
        enum:['USD','EUR'],
        default:'USD'
    },
    frequency:{
        type:String,
        enum:['monthly','yearly'],
        default:'monthly'
    },
    category:{
        type:String,
        enum:['sports','news','entertainment','music'],
        required: true,
    },
    paymentMethod:{
        type:String,
        required:true,
        trim:true
    },
    status: {
        type: String,
        enum: ["active", "cancelled"],
        default: "active",
    },
    startDate:{
        type:Date,
        required:true,
        validate:{
            validator:(value)=>value<new Date(),
            message: 'Start date must be in the past'
        }
    },
    renewalDate:{
        type:Date,
        required:true,
        validate:{
            validator:(value)=>value>this.startDate(),
            message: 'Renewal date must be after the start date'
        }
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
        index:true
    }
}, { timestamps: true });

//Auto-calculate renewal date if missing
subscriptionSchema.pre("save",function(next){
    if(!this.renewalDate){
        const renewalPeriods = {
            daily:1,
            weekly:7,
            monthly:30,
            yearly:365
        };
        this.renewalDate= new Date(this.startDate);
        this.renewalDate.setDate(this.renewalDate.getDate()+renewalPeriods[this.frequency]);
    }
    if(this.renewalDate<new Date()){
        this.status='expired';
    }
    next();
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default mongoose.model("Subscription", subscriptionSchema);
