import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { Camera, CameraType, CameraCapturedPicture } from 'expo-camera';
import * as Location from 'expo-location';
import { Button } from 'react-native-paper';

interface CameraComponentProps {
  onPictureCapture: (picture: CameraCapturedPicture & { location?: Location.LocationObject }) => void;
}

export function CameraComponent({ onPictureCapture }: CameraComponentProps) {
  const [type, setType] = useState(CameraType.back);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<CameraCapturedPicture | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need your permission to use the camera</Text>
        <Button mode="contained" onPress={requestPermission}>
          Grant Permission
        </Button>
      </View>
    );
  }

  const toggleCameraType = () => {
    setType(current => (current === CameraType.back ? CameraType.front : CameraType.back));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const picture = await cameraRef.current.takePictureAsync();
      const pictureWithLocation = location
        ? { ...picture, location }
        : picture;
      setCapturedImage(pictureWithLocation);
      onPictureCapture(pictureWithLocation);
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    onPictureCapture(null as any); // Type assertion to avoid error
  };

  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedImage.uri }} style={styles.camera} />
        <View style={styles.buttonContainer}>
          <Button mode="contained" onPress={retakePicture}>
            Retake
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type} ref={cameraRef}>
        <View style={styles.buttonOuterContainer}>
          <View style={styles.buttonContainer}>
            <Button mode="contained" onPress={toggleCameraType}>
              Flip Camera
            </Button>
            <Button mode="contained" onPress={takePicture}>
              Take Photo
            </Button>   
          </View>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  buttonOuterContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
});