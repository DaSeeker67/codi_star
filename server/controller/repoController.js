// server/controllers/repoController.js
import LangChainService from '../services/Langchainservice.js';

export const processRepository = async (req, res) => {
    try {
        const { files, username, repoName } = req.body;
        const result = await LangChainService.processRepository(
            files, username, repoName
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.error('Error processing repository:', error);
    }
};

export const queryRepository = async (req, res) => {
    try {
        const { query, username, repoName } = req.body;
        const result = await LangChainService.queryRepository(
            query, username, repoName
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.error('Error querying repository:', error);
    }
};