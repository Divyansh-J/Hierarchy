const db = require('../database');

class HierarchyRepository {
    // Create new metadata entry
    static async createMetadata({ userInput, version = 'v0', status = 'in-draft', userFeedback = null }) {
        try {
            const query = `
                INSERT INTO hierarchy_metadata (user_input, version, status, user_feedback)
                VALUES ($1::jsonb, $2, $3, $4)
                RETURNING *
            `;
            // Ensure userInput is a proper object
            const userInputObj = typeof userInput === 'string' ? JSON.parse(userInput) : userInput;
            const values = [JSON.stringify(userInputObj), version, status, userFeedback];
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error in createMetadata:', error);
            console.error('User input that caused the error:', userInput);
            throw error;
        }
    }

    // Create new data entry linked to metadata
    static async createData(metadataId, data) {
        try {
            const query = `
                INSERT INTO hierarchy_data (metadata_id, data)
                VALUES ($1, $2::jsonb)
                RETURNING *
            `;
            // Ensure data is a proper JSON string
            const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
            const values = [metadataId, JSON.stringify(jsonData)];
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error in createData:', error);
            console.error('Data that caused the error:', data);
            throw error;
        }
    }

    // Get metadata by ID
    static async getMetadataById(id) {
        const query = 'SELECT * FROM hierarchy_metadata WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    // Get data by metadata ID
    static async getDataByMetadataId(metadataId) {
        const query = 'SELECT * FROM hierarchy_data WHERE metadata_id = $1 ORDER BY created_at DESC';
        const result = await db.query(query, [metadataId]);
        return result.rows;
    }

    // Update metadata
    static async updateMetadata(id, updates) {
        const { status, userFeedback, version } = updates;
        const setClauses = [];
        const values = [id];
        let paramCount = 1;

        if (status) {
            paramCount++;
            setClauses.push(`status = $${paramCount}`);
            values.push(status);
        }
        if (userFeedback !== undefined) {
            paramCount++;
            setClauses.push(`user_feedback = $${paramCount}`);
            values.push(userFeedback);
        }
        if (version) {
            paramCount++;
            setClauses.push(`version = $${paramCount}`);
            values.push(version);
        }

        if (setClauses.length === 0) {
            throw new Error('No valid fields to update');
        }

        const query = `
            UPDATE hierarchy_metadata
            SET ${setClauses.join(', ')}
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows[0];
    }

    // List all metadata with optional filters
    static async listMetadata({ status, version, limit = 10, offset = 0 } = {}) {
        const whereClauses = [];
        const values = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            whereClauses.push(`status = $${paramCount}`);
            values.push(status);
        }
        if (version) {
            paramCount++;
            whereClauses.push(`version = $${paramCount}`);
            values.push(version);
        }

        const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        
        // First get the paginated results
        const query = `
            SELECT * FROM hierarchy_metadata
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;
        
        // Then get the total count for pagination
        const countQuery = `
            SELECT COUNT(*) as total FROM hierarchy_metadata
            ${whereClause}
        `;

        values.push(limit, offset);
        
        const [result, countResult] = await Promise.all([
            db.query(query, values),
            db.query(countQuery, values.slice(0, -2)) // Remove limit and offset for count
        ]);

        return {
            items: result.rows,
            total: parseInt(countResult.rows[0].total, 10),
            limit,
            offset
        };
    }

    // Delete a metadata entry and its associated data (cascading delete)
    static async deleteMetadata(id) {
        const query = 'DELETE FROM hierarchy_metadata WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
}

module.exports = HierarchyRepository;
