export const API_URL = process.env.REACT_APP_API_URL;

export async function getPhotos() {
    console.log('api url: ' + API_URL);
    const response = await fetch(`${API_URL}/photo`);
    const photoData = await response.json();

    if (!photoData.success || photoData.photos.count < 1)
        return [];

    return photoData.photos.rows.map(photo => ({
        src: `${API_URL}/photo/${photo.filename_th}`,
        filename: photo.filename,
        width: photo.width_th,
        height: photo.height_th,
    }));
};

export async function uploadPhoto(file) {
    if (!file)
        return null;

    const photoFormData = new FormData();
    photoFormData.append("photo", file);

    const response = await fetch(`${API_URL}/photo`, {
        method: "post",
        body: photoFormData,
    });

    return response.json();
};

export async function deletePhoto(photo) {
    if (!photo || !photo.filename)
        return null;

    const response = await fetch(`${API_URL}/photo/${photo.filename}`, {
        method: "delete"
    });

    return response.json();
};

export async function displayPhoto(photo) {
    if (!photo || !photo.filename)
        return null;

    const response = await fetch(`${API_URL}/photo/display/${photo.filename}`);

    return response.json();
}
