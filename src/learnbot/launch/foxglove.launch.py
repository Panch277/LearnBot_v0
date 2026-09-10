import os

from ament_index_python.packages import get_package_share_directory

from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription, DeclareLaunchArgument, LogInfo
from launch.launch_description_sources import AnyLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration


def generate_launch_description():

    use_sim_time = LaunchConfiguration('use_sim_time')

    declare_use_sim_time = DeclareLaunchArgument(
        'use_sim_time',
        default_value='false',
        description='Use simulation (Gazebo) clock if true'
    )

    foxglove_bridge = IncludeLaunchDescription(
        AnyLaunchDescriptionSource([os.path.join(
            get_package_share_directory('foxglove_bridge'), 'launch', 'foxglove_bridge_launch.xml'
        )]),
        launch_arguments={
            'port': '8765',
            'use_sim_time': use_sim_time,
        }.items()
    )

    # foxglove_bridge has no notion of a "layout" -- that's a client-side (Foxglove
    # app) concept. Just point at the installed layout file so it's easy to find and
    # import (Layouts panel -> Import from file) when connecting to ws://<this-host>:8765.
    teleop_layout_path = os.path.join(
        get_package_share_directory('learnbot'), 'config', 'foxglove_layouts', 'teleop.json'
    )
    log_layout_path = LogInfo(
        msg=f'Foxglove teleop layout available at: {teleop_layout_path}'
    )

    return LaunchDescription([
        declare_use_sim_time,
        foxglove_bridge,
        log_layout_path,
    ])
