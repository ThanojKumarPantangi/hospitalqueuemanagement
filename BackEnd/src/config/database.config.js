import mongoose from "mongoose"

const connectDB=async()=>{
    try {
        const conn=await mongoose.connect(process.env.MONGO_URI,{
            autoIndex:true,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
        console.log(`📦 Database Name: ${conn.connection.name}`);
    } catch (error) {
        console.log(`Mongo Connection Failed:{error.message}`)
        process.exit(1)
    }
};

export default connectDB;