import React from 'react';
import { Flex, Box, Spacer, Heading, Button } from '@chakra-ui/react';

function Header ({
    isUploading = false,
    onPhotoSelect
}) {
    let hiddenInput = null;

    return (
        <Flex>
            <Box p="4">
                <Heading fontSize="xl" fontWeight="bold">
                    <span role="img" aria-labelledby="picture">🖼</span>
                    &nbsp;Picture Frame
                </Heading>
            </Box>
            <Spacer/>
            <Flex p="4">
                <Button size="sm" variant="outline" colorScheme="blue"
                        isLoading={isUploading} loadingText="Uploading..."
                        onClick={() => hiddenInput.click()}>
                    Upload Photo
                </Button>
                <input
                    hidden
                    type='file'
                    ref={el => hiddenInput = el}
                    onChange={(e) => onPhotoSelect(e.target.files[0])}
                />
            </Flex>
        </Flex>
    );
};

export default Header;
