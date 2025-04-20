import weaviate, { WeaviateClient } from 'weaviate-client';

export const getClient = async () => {
  const client: WeaviateClient = await weaviate.connectToLocal();
  // console.log('client = ', client);

  const clientReadiness = await client.isReady();
  console.log('clientReadiness = ', clientReadiness);

  return client;
}
