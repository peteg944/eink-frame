import React, { useEffect, useState } from 'react';
import Gallery from 'react-photo-gallery';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
    ModalBody, ModalCloseButton } from '@chakra-ui/modal';
import { Button } from '@chakra-ui/button';
import { Image, useDisclosure } from '@chakra-ui/react';
import { useToast } from '@chakra-ui/toast';

import Header from './header.component';
import { deletePhoto, getPhotos, uploadPhoto, displayPhoto } from './api';

function AppContainer() {
    const [ isUploading, setIsUploading ] = useState(false);
    const [ isDeleting, setIsDeleting ] = useState(false);
    const [ isDisplaying, setIsDisplaying ] = useState(false);
    const [ photos, setPhotos ] = useState([]);
    const [ selectedPhoto, setSelectedPhoto ] = useState({});
    const { isOpen: mIsOpen, onOpen: mOnOpen, onClose: mOnClose } =
        useDisclosure();
    const toast = useToast();

    useEffect(() => {
        if (!isUploading)
            getPhotos().then(setPhotos);
    }, [ isUploading ]);

    useEffect(() => {
        if (!isDeleting)
            getPhotos().then(setPhotos);
    }, [ isDeleting ]);

    async function handlePhotoSelect(file) {
        setIsUploading(true);

        try {
            const result = await uploadPhoto(file);
            if (!result.success) {
                throw new Error("Error uploading photo");
            }
            toast({
                duration: 5000,
                status: "success",
                isClosable: true,
                title: "Upload complete",
                description: "Image was successfully saved!",
            });
        } catch (err) {
            toast({
                duration: 9000,
                status: "error",
                isClosable: true,
                title: "Upload error",
                description: err.message,
            });
        }

        setIsUploading(false);
    }

    async function handlePhotoDelete(filename) {
        setIsDeleting(true);

        try {
            const result = await deletePhoto(selectedPhoto);
            if (!result.success) {
                throw new Error("Error deleting photo");
            }
            toast({
                duration: 5000,
                status: "success",
                isClosable: true,
                title: "Delete success",
                description: "Image was successfully deleted.",
            });
        } catch (err) {
            toast({
                duration: 5000,
                status: "error",
                isClosable: true,
                title: "Delete error",
                description: err.message,
            });
        }

        setIsDeleting(false);
        mOnClose();
    }

    async function handlePhotoDisplay(filename) {
        setIsDisplaying(true);

        try {
            const result = await displayPhoto(selectedPhoto);
            if (!result.success) {
                throw new Error("Error displaying photo");
            }
            toast({
                duration: 5000,
                status: "success",
                isClosable: true,
                title: "Display success",
                description: "Image was successfully displayed.",
            });
        } catch (err) {
            toast({
                duration: 5000,
                status: "error",
                isClosable: true,
                title: "Display error",
                description: err.message,
            });
        }

        setIsDisplaying(false);
        mOnClose();
    }

    return (
        <>
            <Header isUploading={isUploading} onPhotoSelect={handlePhotoSelect} />
            <Gallery photos={photos} onClick={(e, obj) => {
                setSelectedPhoto(obj.photo);
                mOnOpen();
            }} />
            <Modal isOpen={mIsOpen} onClose={mOnClose}>
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader>What would you like to do?</ModalHeader>
                    <ModalCloseButton/>
                    <ModalBody>
                        <Image src={selectedPhoto.src} width="25%" />
                        Delete this image by pressing Delete, or show it on the
                        picture frame by pressing Display.
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="red" mr={3} isLoading={isDeleting}
                            onClick={handlePhotoDelete}>Delete</Button>
                        <Button isLoading={isDisplaying}
                            onClick={handlePhotoDisplay}>Display</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}

export default AppContainer;
