
import multer from "multer";

export const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 1024 * 1024,
        files: 1,
    },

    fileFilter(req, file, callback) {
        const filename = file.originalname.toLowerCase();

        const isCSV = filename.endsWith(".csv");
        const isExcel = filename.endsWith(".xlsx");

        if (!isCSV && !isExcel) {
            const error = new Error(
                "Only CSV and Excel (.xlsx) files are supported."
            );
            error.status = 400;
            return callback(error);
        }

        callback(null, true);
    },
});
