import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export const uploadImage = async (fileUri: string, folder: string = 'shop-manager') => {
    try {
        const result = await cloudinary.uploader.upload(fileUri, {
            folder,
        });
        return result;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};

export const deleteImage = async (publicId: string) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw error;
    }
};

/**
 * Extracts publicId from Cloudinary URL
 * Example: https://res.cloudinary.com/cloudname/image/upload/v12345/shop-manager/filename.jpg
 * publicId: shop-manager/filename
 */
export const getPublicIdFromUrl = (url: string) => {
    const parts = url.split('/');
    const filenameWithExtension = parts.pop();
    const folder = parts.pop(); // Assuming it's in a folder

    if (!filenameWithExtension) return null;

    const filename = filenameWithExtension.split('.')[0];
    return folder ? `${folder}/${filename}` : filename;
};
