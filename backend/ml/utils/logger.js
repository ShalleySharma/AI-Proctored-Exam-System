import logging from 'logging'; // Assuming Node.js logging module, or use console

export const setup_logger = () => {
    const logger = {
        info: (message) => console.log(`INFO: ${message}`),
        error: (message) => console.error(`ERROR: ${message}`)
    };
    return logger;
};
