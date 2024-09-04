import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { PublicKey } from '@solana/web3.js';
import { CameraCapturedPicture } from 'expo-camera';
import * as Location from 'expo-location';
import { bundlrStorage, Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js';
import { useMobileWallet } from '../../utils/useMobileWallet';
import { Connection } from '@solana/web3.js';

interface NFTMinterProps {
  picture: CameraCapturedPicture & { location?: Location.LocationObject };
  selectedAccount: PublicKey;
}

export function NFTMinter({ picture, selectedAccount }: NFTMinterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [mintedNFT, setMintedNFT] = useState<string | null>(null);
  const { signAndSendTransaction } = useMobileWallet();

  const mintNFT = async () => {
    setIsLoading(true);
    try {
      const connection = new Connection('https://api.devnet.solana.com');
      // Initialize Metaplex
      const metaplex = Metaplex.make(connection)
        .use(walletAdapterIdentity({
          signTransaction: async (tx) => {
            await signAndSendTransaction(tx);
            return tx;
          },
          publicKey: selectedAccount,
        }))
        .use(bundlrStorage());

      // Upload image
      const { uri } = await metaplex.storage().upload(picture.uri);

      // Prepare metadata
      const { latitude, longitude } = picture.location?.coords || {};
      const metadata = {
        name: 'My Solana NFT',
        description: 'An NFT created with Solana Mobile Stack',
        image: uri,
        attributes: [
          { trait_type: 'Latitude', value: latitude?.toString() || 'Unknown' },
          { trait_type: 'Longitude', value: longitude?.toString() || 'Unknown' },
        ],
      };

      // Create NFT
      const { nft } = await metaplex.nfts().create({
        uri: await metaplex.storage().upload(metadata),
        name: metadata.name,
        sellerFeeBasisPoints: 500, // 5% royalty
      });

      setMintedNFT(nft.address.toString());
    } catch (error) {
      console.error('Error minting NFT:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: picture.uri }} style={styles.image} />
      {mintedNFT ? (
        <View style={styles.resultContainer}>
          <Text>NFT Minted Successfully!</Text>
          <Text>Address: {mintedNFT}</Text>
        </View>
      ) : (
        <Button
          mode="contained"
          onPress={mintNFT}
          loading={isLoading}
          disabled={isLoading}
        >
          Mint NFT
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
  resultContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
});
