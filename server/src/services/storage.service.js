import Imagekit from "imagekit";
import dotenv from "dotenv";
dotenv.config();

const storageInstance = new Imagekit({
  urlEndpoint: process.env.IMG_URL_ENDPOINT,
  privateKey: process.env.IMG_PRIVATE_KEY,
  publicKey: process.env.IMG_PUBLIC_KEY,
});

const sendFiles = async (file, fileName) => {
  let obj = {
    file,
    fileName,
    folder: "discord",
  };
  return await storageInstance.upload(obj);
};

export default sendFiles;

// import ImageKit from "@imagekit/nodejs";
// import dotenv from "dotenv";

// dotenv.config();

// const storageInstance = new ImageKit({
//   privateKey: process.env.IMG_PRIVATE_KEY,
// });

// const sendFiles = async (file, fileName) => {
//   const result = await storageInstance.files.upload({
//     file,
//     fileName,
//     folder: "/discord",
//   });

//   return result;
// };

// export default sendFiles;
