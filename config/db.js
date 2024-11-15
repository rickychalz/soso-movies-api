import mongoose from "mongoose";

const  DB_NAME = "Cluster0";

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(`${process.env.MONGODB_URI}`)
        console.log(`\n MongoDB connection success!`)
    } catch (error){
        console.log("MongoDB connection error!", error)
        process.exit(1)
    }
}

export default connectDB