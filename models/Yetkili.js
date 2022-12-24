const mongoose = require("mongoose");
const { isEmail, isStrongPassword } = require("validator");
const bcrypt = require("bcrypt");

const YetkiliSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: isEmail,
  },
  parola: {
    type: String,
    required: true,
    minLength: 6,
    validate: isStrongPassword,
  },
});

YetkiliSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  this.parola = await bcrypt.hash(this.parola, salt);
  next();
});

const Yetkili = mongoose.model("yetkili", YetkiliSchema);

module.exports = Yetkili;
