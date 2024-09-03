import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { CameraCapturedPicture } from 'expo-camera';
import * as Location from 'expo-location';

import { Section } from "../Section";
import { useAuthorization } from "../utils/useAuthorization";
import { CameraComponent } from "../components/camera/camera-feature";
import { NFTMinter } from "../components/nft-minter/nft-minter";

export function HomeScreen() {
  const { selectedAccount } = useAuthorization();
  const [picture, setPicture] = useState<(CameraCapturedPicture & { location?: Location.LocationObject }) | null>(null);

  const handlePictureCapture = (newPicture: (CameraCapturedPicture & { location?: Location.LocationObject }) | null) => {
    setPicture(newPicture);
  };

  return (
    <View style={styles.screenContainer}>
      <Text
        style={{ fontWeight: "bold", marginBottom: 12 }}
        variant="displaySmall"
      >
        Solana NFT Minter
      </Text>
      {!selectedAccount ? (
        <Section
          title="Connect Wallet to start"
          description="Take a picture to mint your NFT"
        />
      ) : !picture ? (
        <>
          <Section title="Camera" />
          <CameraComponent onPictureCapture={handlePictureCapture} />
        </>
      ) : (
        <>
          <Section title="Mint NFT" />
          <NFTMinter picture={picture} selectedAccount={selectedAccount.publicKey} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    padding: 16,
    flex: 1,
  },
  buttonGroup: {
    flexDirection: "column",
    paddingVertical: 4,
  },
});
