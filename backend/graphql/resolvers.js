const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');
const {clearImage} = require('../util/file');

module.exports = {
  createUser: async function({ userInput }, req) {
    console.log('reached create user');
    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      const error = new Error('User already exists!');
      throw error;
    }
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: 'Email is invalid' });
    }

    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: 'Password too short' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const hashedPw = await bcrypt.hash(userInput.password, 12);

    const user = new User({
      email: userInput.email,
      password: hashedPw,
      name: userInput.name
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },
  login: async function({ email, password }, req) {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('No user found');
      error.code = 401;
      throw error;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error('Password incorrect');
      error.code = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        email: email,
        userId: user._id.toString()
      },
      'secretKey',
      { expiresIn: '1h' }
    );

    return { token, userId: user._id.toString() };
  },
  createPost: async function({ postInputData }, req) {
    console.log('inside create Post');
    if (req.auth === false) {
      const error = new Error('Authentication failed.');
      error.code = 401;
      throw error;
    }
    const errors = [];
    if (
      validator.isEmpty(postInputData.title) ||
      !validator.isLength(postInputData.title, { min: 5 })
    ) {
      errors.push({ message: 'Invalid title' });
    }
    if (
      validator.isEmpty(postInputData.content) ||
      !validator.isLength(postInputData.content, { min: 5 })
    ) {
      errors.push({ message: 'Invalid content' });
    }

    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const creator = await User.findById({ _id: req.userId });
    const post = new Post({
      title: postInputData.title,
      content: postInputData.content,
      imageUrl: postInputData.imageUrl,
      creator
    });

    const createdPost = await post.save();
    creator.posts.push(createdPost);
    await creator.save();
    console.log(createdPost);
    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString()
    };
  },
  fetchPosts: async function({ page }, req) {
    if (req.auth === false) {
      const error = new Error('Authentication failed.');
      error.code = 401;
      throw error;
    }
    const currentPage = page || 1;
    const perPage = 2;

    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate('creator')
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    return {
      posts: posts.map(p => {
        return {
          ...p._doc,
          _id: p._id.toString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString()
        };
      }),
      totalItems: totalItems
    };
  },
  fetchSinglePost:async function({postId},req){
    if (req.auth === false) {
      const error = new Error('Authentication failed.');
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(postId).populate('creator');

    if (!post) {
      const error = new Error('No post found.');
      error.code = 404;
      throw error;
    }

    return {
      ...post._doc,
      _id:post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    }
  },
  updatePost: async function({ postId,postInputData }, req) {
    if (req.auth === false) {
      const error = new Error('Authentication failed.');
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(postId).populate('creator');
    if (!post) {
      const error = new Error('No post found.');
      error.code = 404;
      throw error;
    }

    if(post.creator._id.toString() !== req.userId){
      const error = new Error('Unauthenticated!');
      error.code = 403;
      throw error;
    }

    const errors = [];
    if (
      validator.isEmpty(postInputData.title) ||
      !validator.isLength(postInputData.title, { min: 5 })
    ) {
      errors.push({ message: 'Invalid title' });
    }
    if (
      validator.isEmpty(postInputData.content) ||
      !validator.isLength(postInputData.content, { min: 5 })
    ) {
      errors.push({ message: 'Invalid content' });
    }

    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    post.title =  postInputData.title;
    post.content = postInputData.content;

    if(postInputData.imageUrl !== 'undefined'){
      post.imageUrl = postInputData.imageUrl;
    }

    const updatedPost = await post.save();

    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString()
    };
  },
  deletePost: async function({ postId }, req) {
    if (req.auth === false) {
      const error = new Error('Authentication failed.');
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(postId).populate('creator');
    if (!post) {
      const error = new Error('No post found.');
      error.code = 404;
      throw error;
    }

    if(post.creator._id.toString() !== req.userId){
      const error = new Error('Unauthenticated!');
      error.code = 403;
      throw error;
    }

    clearImage(post.imageUrl);
    await Post.findByIdAndDelete(postId);
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();

    return true;
  },
  userStatus: async function({ }, req) {
    if (req.auth === false) {
      const error = new Error('Authentication failed.');
      error.code = 401;
      throw error;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('No user found.');
      error.code = 404;
      throw error;
    }

    return {...user._doc, _id:user._id.toString()}
  },
  updateStatus: async function({ status}, req) {
    if (req.auth === false) {
      const error = new Error('Authentication failed.');
      error.code = 401;
      throw error;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('No user found.');
      error.code = 404;
      throw error;
    }
    user.status = status;
    await user.save();
    return {...user._doc, _id:user._id.toString()}
  }
};
