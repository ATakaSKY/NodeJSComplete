const { buildSchema } = require('graphql');

module.exports = buildSchema(`

    type Post{
        _id:ID!
        title:String!
        imageUrl:String!
        content:String!
        creator:User!
        createdAt:String!
        updatedAt:String!
    }

    type User{
        _id:ID!
        name:String!
        email:String!
        password:String!
        status:String!
        posts:[Post!]!
    }

    type AuthData{
        token:String!
        userId:String! 
    }

    type PostsData{
        posts:[Post!]!
        totalItems:Int!
    }

    input PostInputData{
        title:String!
        content:String!
        imageUrl:String!
    }

    input UserInputData{
        email:String!
        name:String!
        password:String!
    }

    type RootMutation{
        createUser(userInput:UserInputData):User!
        createPost(postInputData:PostInputData):Post!
        updatePost(postId:ID!, postInputData:PostInputData):Post!
        deletePost(postId:ID!):Boolean
        updateStatus(status:String!):User!
    }

    type RootQuery{
        login(email:String!, password:String!):AuthData!
        fetchPosts(page:Int):PostsData!
        fetchSinglePost(postId:ID!):Post!
        userStatus:User!
    }

    schema {
        mutation:RootMutation
        query:RootQuery
    }
`);
