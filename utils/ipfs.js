//IPFS Integration for Metadata

// utils/ipfs.js
import { create } from 'ipfs-http-client';

const client = create({ 
  host: 'ipfs.infura.io', 
  port: 5001, 
  protocol: 'https',
  headers: {
    authorization: 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64')
  }
});

export const uploadToIPFS = async (metadata) => {
  try {
    const result = await client.add(JSON.stringify(metadata));
    return result.path;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
};

export const fetchFromIPFS = async (hash) => {
  try {
    const stream = client.cat(hash);
    let data = '';
    for await (const chunk of stream) {
      data += new TextDecoder().decode(chunk);
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error fetching from IPFS:', error);
    throw error;
  }
};