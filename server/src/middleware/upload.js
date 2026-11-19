
import multer from "multer";

export const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 1024 * 1024,
        files: 1,
    },

    fileFilter(req, file, callback) {
        if (!file.originalname.toLowerCase().endsWith(".csv")) {
            const error = new Error("Only CSV files are supported.");
            error.status = 400;
            return callback(error);
        }

        callback(null, true);
    },
});
