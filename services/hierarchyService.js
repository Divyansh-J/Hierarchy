const HierarchyRepository = require('../db/repositories/hierarchyRepository');

class HierarchyService {
    /**
     * Create a new hierarchy with metadata and initial data
     * @param {Object} params
     * @param {Object} params.userInput - User input containing company and location
     * @param {string} params.version - Version string (e.g., 'v0', 'v1')
     * @param {Object} params.data - The hierarchy data to store
     * @returns {Promise<Object>} Created metadata and data
     */
    static async createHierarchy({ userInput, version = 'v0', data, userFeedback = null, status = 'in-draft' }) {
        // Validate required fields
        if (!userInput || !userInput.company || !userInput.location) {
            throw new Error('Company and location are required in userInput');
        }
        if (!data) {
            throw new Error('Data is required');
        }
    
        try {
            // Create metadata
            const metadata = await HierarchyRepository.createMetadata({
                userInput,
                version,
                status, // Use the status passed in, or the default 'in-draft'
                userFeedback
            });
    
            // Create data entry
            const dataEntry = await HierarchyRepository.createData(metadata.id, data);
    
            return {
                metadata,
                data: dataEntry
            };
        } catch (error) {
            console.error('Error in createHierarchy:', error);
            throw error;
        }
    }

    /**
     * Get a hierarchy by its metadata ID
     * @param {string} metadataId - The ID of the metadata
     * @returns {Promise<Object>} The metadata and associated data
     */
    static async getHierarchy(metadataId) {
        try {
            const [metadata, data] = await Promise.all([
                HierarchyRepository.getMetadataById(metadataId),
                HierarchyRepository.getDataByMetadataId(metadataId)
            ]);

            if (!metadata) {
                throw new Error('Hierarchy not found');
            }

            return {
                metadata,
                data
            };
        } catch (error) {
            console.error('Error getting hierarchy:', error);
            throw error;
        }
    }

    /**
     * Update hierarchy metadata
     * @param {string} metadataId - The ID of the metadata to update
     * @param {Object} updates - Fields to update
     * @param {string} [updates.status] - New status ('in-draft' or 'approved')
     * @param {string} [updates.userFeedback] - User feedback
     * @param {string} [updates.version] - New version
     * @returns {Promise<Object>} Updated metadata
     */
    static async updateMetadata(metadataId, updates) {
        try {
            return await HierarchyRepository.updateMetadata(metadataId, updates);
        } catch (error) {
            console.error('Error updating metadata:', error);
            throw error;
        }
    }

    /**
     * Add new data to an existing hierarchy
     * @param {string} metadataId - The ID of the metadata
     * @param {Object} data - The new data to add
     * @returns {Promise<Object>} The created data entry
     */
    static async addHierarchyData(metadataId, data) {
        try {
            // Verify metadata exists
            const metadata = await HierarchyRepository.getMetadataById(metadataId);
            if (!metadata) {
                throw new Error('Metadata not found');
            }

            return await HierarchyRepository.createData(metadataId, data);
        } catch (error) {
            console.error('Error adding hierarchy data:', error);
            throw error;
        }
    }

    /**
     * List hierarchies with optional filters and pagination
     * @param {Object} [filters] - Filter criteria
     * @param {string} [filters.status] - Filter by status
     * @param {string} [filters.version] - Filter by version
     * @param {number} [limit=10] - Number of items per page
     * @param {number} [offset=0] - Offset for pagination
     * @returns {Promise<Object>} Paginated list of hierarchies
     */
    static async listHierarchies(filters = {}, limit = 10, offset = 0) {
        try {
            return await HierarchyRepository.listMetadata({
                ...filters,
                limit,
                offset
            });
        } catch (error) {
            console.error('Error listing hierarchies:', error);
            throw error;
        }
    }

    /**
     * Delete a hierarchy and all its data
     * @param {string} metadataId - The ID of the metadata to delete
     * @returns {Promise<Object>} The deleted metadata
     */
    static async deleteHierarchy(metadataId) {
        try {
            return await HierarchyRepository.deleteMetadata(metadataId);
        } catch (error) {
            console.error('Error deleting hierarchy:', error);
            throw error;
        }
    }
}

module.exports = HierarchyService;
