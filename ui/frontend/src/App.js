import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';

import AppContainer from './app.container';

function App() {
    return (
        <div>
            <ChakraProvider>
                <AppContainer />
            </ChakraProvider>
        </div>
    );
}

export default App;
