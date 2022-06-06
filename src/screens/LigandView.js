import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  useColorScheme,
} from "react-native";
import useColors from "../hooks/useColors";
import useOrientation from "../hooks/useOrientation";
// import { useColorScheme } from "react-native-appearance";
import styles from "../styles/LigandView.styles.js";
import { AntDesign } from "@expo/vector-icons";
import * as THREE from "three";
import ExpoTHREE, { Renderer, TextureLoader } from "expo-three";
import SwitchSelector from "react-native-switch-selector";
import { GLView } from "expo-gl";
import OrbitControlsView from "../components/OrbitControlView";
import COLORS from "../consts/colors.js";

// Rasmol VS Jmol

const LigandView = ({ navigation, route }) => {
  const { ligand, atoms, connections } = route.params;
  const [selectedColor, setSelectedColor] = useState("rasmol");
  const [mode, setMode] = useState("1");
  const [width, setWidth] = useState();
  const [height, setHeight] = useState();
  const [key, setKey] = useState(1);

  const colorOptions = [
    { label: "Rasmol", value: "rasmol" },
    { label: "Jmol", value: "jmol" },
  ];
  const modes = [
    { label: "Balls", value: "1" },
    { label: "Both", value: "2" },
    // { label: "Sticks", value: "3" },
  ];

  const orientation = useOrientation();
  const colorScheme = useColorScheme();
  let timeout;
  const windowWidth = Dimensions.get("window").width;
  const windowHeight = Dimensions.get("window").height;

  useEffect(() => {
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    setKey(key + 1);
  }, [mode, selectedColor]);

  useEffect(() => {
    let hDim = Dimensions.get("window").height;
    let wDim = Dimensions.get("window").width;
    setWidth(wDim);
    setHeight(hDim);
  }, [orientation]);

  useEffect(() => {
    let aspect = height - width > 0 ? height / width : width / height;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  }, [height]);

  // useEffect(() => {
  //   camera.fov = fov;
  //   camera.updateProjectionMatrix();
  // }, [fov]);

  /****************Three******************/
  // scene
  const scene = new THREE.Scene();
  //camera

  const camera = new THREE.PerspectiveCamera(75, 0.5, 0.01, 2000);
  // Raycast
  const raycaster = new THREE.Raycaster();

  //sphere
  const geometry = new THREE.SphereGeometry(0.05);
  if (mode === "2") {
    for (let i = 0; i < atoms.length; i++) {
      let color;
      if (selectedColor == "jmol") color = useColors(atoms[i].name).jmol;
      else color = useColors(atoms[i].name).rasmol;
      const material = new THREE.MeshPhysicalMaterial({
        color: parseInt(`0x${color}`, 16),
        emissive: parseInt(`0x${color}`, 16),
        metalness: 1,
        roughness: 0,
        reflectivity: 0,
        clearcoat: 1,
        clearcoatRoughness: 0,
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(
        atoms[i].position.x,
        atoms[i].position.y,
        atoms[i].position.z
      );
      sphere.name = atoms[i].name;
      scene.add(sphere);
    }
  }

  //cylinder
  for (let i = 0; i < connections.length; i++) {
    let start = new THREE.Vector3(
      atoms[connections[i].index - 1].position.x,
      atoms[connections[i].index - 1].position.y,
      atoms[connections[i].index - 1].position.z
    );
    for (let j = 0; j < connections[i].connects.length; j++) {
      let end = new THREE.Vector3(
        atoms[connections[i].connects[j] - 1].position.x,
        atoms[connections[i].connects[j] - 1].position.y,
        atoms[connections[i].connects[j] - 1].position.z
      );
      let dist = start.distanceTo(end);
      let cylColor =
        mode == 1 ? 0x3c3939 : colorScheme === "light" ? 0x000000 : 0xffffff;
      const materialCyl = new THREE.MeshBasicMaterial({
        color: cylColor,
      });
      const cylinderGeometry = new THREE.CylinderGeometry(0.01, 0.01, dist, 64);
      let axis = new THREE.Vector3(
        start.x - end.x,
        start.y - end.y,
        start.z - end.z
      ).normalize();
      const quaternion = new THREE.Quaternion();
      const cylinderUpAxis = new THREE.Vector3(0, 1, 0);
      quaternion.setFromUnitVectors(cylinderUpAxis, axis);
      cylinderGeometry.applyQuaternion(quaternion);
      cylinderGeometry.translate(
        (start.x + end.x) / 2,
        (start.y + end.y) / 2,
        (start.z + end.z) / 2
      );
      const cylinderMesh = new THREE.Mesh(cylinderGeometry, materialCyl);
      cylinderMesh.frustumCulled = false;
      scene.add(cylinderMesh);
    }
  }

  /****************Function raycast******************/
  const handleStateChange = ({ nativeEvent: { locationX, locationY } }) => {
    let mouse = new THREE.Vector2();
    mouse.x = (locationX / windowWidth) * 2 - 1;
    mouse.y = -(locationY / windowHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects[0]?.object?.name) {
      alert(intersects[0]?.object?.name);
      console.log(intersects[0]?.object?.name);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      {/* <ScrollView> */}
      <View
        style={{
          flex: 0.3,
        }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <AntDesign name="arrowleft" size={24} color="black" />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
            }}
          >
            Ligand:{" "}
            <Text
              style={{
                color: COLORS.red,
              }}
            >
              {ligand}
            </Text>
          </Text>
          <TouchableOpacity>
            <AntDesign name="sharealt" size={24} color="black" />
          </TouchableOpacity>
        </View>
        {/* <TouchableOpacity
          onPress={() => {
            camera.fov = 50;
            camera.updateProjectionMatrix();
          }}
          style={{
            width: 35,
            height: 35,
            backgroundColor: "red",
          }}
        >
          <Text>++++++</Text>
        </TouchableOpacity> */}

        <View
          style={{
            marginTop: 20,
            paddingHorizontal: 20,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              marginLeft: 5,
              marginBottom: 10,
            }}
          >
            Color:
          </Text>
          <SwitchSelector
            options={colorOptions}
            initial={0}
            onPress={(value) => setSelectedColor(value)}
            buttonColor={COLORS.red}
            borderColor={COLORS.red}
            borderRadius={18}
            fontSize={15}
            bold={true}
            hasPadding={true}
          />
        </View>
        <View
          style={{
            marginTop: 20,
            paddingHorizontal: 20,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              marginLeft: 5,
              marginBottom: 10,
            }}
          >
            Modes:
          </Text>
          <SwitchSelector
            options={modes}
            initial={0}
            onPress={(value) => setMode(value)}
            buttonColor={COLORS.red}
            borderColor={COLORS.red}
            fontSize={15}
            bold={true}
            borderRadius={18}
            hasPadding={true}
          />
        </View>
      </View>
      <View
        style={{
          flex: 0.7,
          borderWidth: 2,
          borderColor: COLORS.red,
          // height: 500,
          marginTop: 20,
        }}
      >
        <OrbitControlsView
          camera={camera}
          onTouchEndCapture={handleStateChange}
          // style={{ flex: 1 }}
          style={{ width: width, height: height }}
          // key={height}
        >
          <GLView
            key={key}
            style={{ flex: 1 }}
            onContextCreate={async (gl) => {
              /*||||||||||||||Camera||||||||||||||*/
              camera.position.set(0, 0, 4);

              /*||||||||||||||Render||||||||||||||*/
              const renderer = new Renderer({ gl });
              renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
              renderer.setClearColor(
                colorScheme === "light" ? 0xffffff : 0x000000,
                1
              );
              /*||||||||||||||Light||||||||||||||*/
              const directionalLight = new THREE.DirectionalLight(
                0xffffff,
                0.5
              );
              directionalLight.position.set(0, 0, 100);
              scene.add(directionalLight);
              /*||||||||||||||Render Function||||||||||||||*/
              const animate = () => {
                timeout = requestAnimationFrame(animate);
                directionalLight.position.copy(camera.position);
                camera.updateProjectionMatrix();
                renderer.render(scene, camera);
                gl.endFrameEXP();
              };
              /*||||||||||||||Render||||||||||||||*/
              animate();
            }}
          />
        </OrbitControlsView>
      </View>
      {/* <View style={styles.footer}></View> */}
      {/* </ScrollView> */}
    </SafeAreaView>
  );
};

export default LigandView;
