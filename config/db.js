

const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const connectDB = async () => {
    const connect = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${connect.connection.host}`.bgMagenta.bold);
}

module.exports = connectDB;