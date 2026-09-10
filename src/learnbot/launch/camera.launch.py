import os

from launch import LaunchDescription
from launch_ros.actions import Node

# Uses camera_ros (libcamera-backed), the driver that actually brings up the
# Pi Camera Module v2 (IMX219) on Ubuntu -- v4l2_camera doesn't work here
# because there's no /dev/videoX for the CSI sensor without libcamera in
# between. Requires `ros-humble-camera-ros` and `libcamera-dev` on the Pi.

def generate_launch_description():



    return LaunchDescription([

        Node(
            package='camera_ros',
            executable='camera_node',
            name='camera',
            output='screen',
            namespace='camera',
            parameters=[{
                'camera': 0,
                'width': 640,
                'height': 480,
                'format': 'RGB888',
                'frame_id': 'camera_link_optical'
                }]
    )
    ])
