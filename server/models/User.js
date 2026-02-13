// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },

    company: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      required: true
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },

    domain: {
      type: String,
      required: true
    },

    isAdmin: {
      type: Boolean,
      default: false
    },


    profilePic: {
      data: Buffer,
      contentType: String,
    }
  },
  { timestamps: true }
);

// 🔐 Hash password before save
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("User", userSchema);