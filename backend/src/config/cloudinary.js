import cloudinary from 'cloudinary';
import { envConfig } from './env.js';

cloudinary.v2.config({
  cloud_name: envConfig.cloudinaryCloudName,
  api_key: envConfig.cloudinaryApiKey,
  api_secret: envConfig.cloudinaryApiSecret,
});

export default cloudinary.v2;
