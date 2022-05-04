import { Model, DataTypes } from "sequelize";

const PhotoSchema = {
    originalname:   { type: DataTypes.STRING,   allowNull: false, }, // Original filename (e.g. IMG_123.jpeg)
    mimetype:       { type: DataTypes.STRING,   allowNull: false, }, // Type of image
    size:           { type: DataTypes.INTEGER,  allowNull: false, }, // Size in bytes
    filename:       { type: DataTypes.STRING,   allowNull: false, }, // Randomly-generated filename when uploaded
    filename_th:    { type: DataTypes.STRING,   allowNull: false, }, // Randomly-generated filename, thumbnail version
    path:           { type: DataTypes.STRING,   allowNull: false, }, // Path to uploaded image
    path_th:        { type: DataTypes.STRING,   allowNull: false, }, // Path to uploaded image's thumbnail
    width:          { type: DataTypes.INTEGER,  allowNull: false, }, // Width in pixels
    width_th:       { type: DataTypes.INTEGER,  allowNull: false, }, // Width in pixels, thumbnail
    height:         { type: DataTypes.INTEGER,  allowNull: false, }, // Height in pixels
    height_th:      { type: DataTypes.INTEGER,  allowNull: false, }, // Height in pixels, thumbnail
};

class PhotoModel extends Model {
    static init (sequelize) {
        return super.init(PhotoSchema, { sequelize });
    }
};

export default PhotoModel;
