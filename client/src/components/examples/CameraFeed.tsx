import { CameraFeed } from '../CameraFeed';
import storeCameraImage from '@assets/generated_images/Store_security_camera_placeholder_afab940c.png';
import entranceCameraImage from '@assets/generated_images/Store_entrance_camera_placeholder_c157836f.png';
import parkingCameraImage from '@assets/generated_images/Store_parking_camera_placeholder_8962d0cd.png';

export default function CameraFeedExample() {
  const mockCameras = [
    {
      id: "cam-1",
      name: "Main Store",
      location: "Aisle 1-3",
      isActive: true,
      simulatedImageUrl: storeCameraImage
    },
    {
      id: "cam-2", 
      name: "Entrance",
      location: "Front Door",
      isActive: true,
      simulatedImageUrl: entranceCameraImage
    },
    {
      id: "cam-3",
      name: "Parking Lot",
      location: "Exterior",
      isActive: false
    }
  ];

  const handleSettings = (id: string) => {
    console.log(`Camera settings for ${id}`);
  };

  const handleFullscreen = (id: string) => {
    console.log(`Fullscreen camera ${id}`);
  };

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-6xl">
      {mockCameras.map(camera => (
        <CameraFeed
          key={camera.id}
          {...camera}
          onSettings={handleSettings}
          onFullscreen={handleFullscreen}
        />
      ))}
    </div>
  );
}