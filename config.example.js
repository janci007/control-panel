module.exports = {
  mqtt: {
    broker: "tcp://localhost"
  },
  switches: [
      {
          id: 0,
          service: "exec",
          type: "command",
          item: {
              up: "false",
              down: "systemctl suspend",
              status: "false"
          }
      },
      {
        id: 3,
        service: "exec",
        type: "command",
        item: {
          up: "false",
          down: "DISPLAY=:0 xrandr --output DP-1-1 --auto --left-of eDP-1-1",
          status: "false"
        }
      },
      {
          id: 4,
          service: "networkmanager",
          type: "connection",
          item: "VPN1"
      },
      {
          id: 5,
          service: "networkmanager",
          type: "connection",
          item: "VPN2"
      },
      {
          id: 6,
          service: "networkmanager",
          type: "connection",
          item: "VPN3"
      },
      { 
          id: 11,
          service: "exec",
          type: "command",
          item: {
              up: "sshfs hostname:/ /mnt/somewhere",
              down: "fusermount -u -z /mnt/somewhere",
              status: "mountpoint -q /mnt/somewhere",
              interval: 5
          }
      },
      { 
          id: 9,
          service: "exec",
          type: "command",
          item: {
              up: '/bin/echo -e "user\\ndomain\\npassword\\n" | gio mount smb://smbhost/share',
              down: "gio mount -u smb://smbhost/share",
              status: 'test -d /run/user/1000/gvfs/smb-share\:server\=smbhost\,share\=share/',
              interval: 5
          }
      },
      { 
          id: 8,
          service: "exec",
          type: "command",
          item: {
              up: 'mount /mnt/mountpoint',
              down: "umount -l /mnt/mountpoint",
              status: 'mountpoint -q /mnt/mountpoint',
              interval: 5
          }
      },
      { 
          id: 12,
          service: "exec",
          type: "command",
          item: {
              up: 'VBoxManage startvm "VM name"',
              down: 'VBoxManage controlvm "VM name" savestate',
              status: 'VBoxManage list runningvms | grep -q "VM name"',
              interval: 5
          }
      },
      { 
          id: 13,
          service: "exec",
          type: "command",
          item: {
              up: 'vscodium --unity-launch&',
              down: 'pkill -fx "/usr/share/vscodium/vscodium --unity-launch" && sleep 3',
              status: 'pgrep -fx "/usr/share/vscodium/vscodium --unity-launch"',
              interval: 5
          }
      },
      { 
          id: 14,
          service: "exec",
          type: "command",
          item: {
              up: 'netbeans&',
              down: 'pkill -f /usr/share/netbeans/10.0/platform/lib/nbexec',
              status: 'pgrep -f "^/bin/bash /usr/share/netbeans/10.0/platform/lib/nbexec"',
              interval: 5
          }
      },
      { 
          id: 17,
          service: "exec",
          type: "command",
          item: {
              up: 'teams&',
              down: 'pkill -fx /usr/share/teams/teams && sleep 2',
              status: 'pgrep -fx /usr/share/teams/teams',
              interval: 5
          }
      },
      { 
          id: 16,
          service: "exec",
          type: "command",
          item: {
              up: 'slack&',
              down: 'pkill -fx /usr/lib/slack/slack',
              status: 'pgrep -fx /usr/lib/slack/slack',
              interval: 5
          }
      },
      {
          id: 20,
          service: "pulseaudio",
          type: "profile",
          item: {
              device: "bluez_card.38_18_4C_BE_C5_1A",
              profile: {
                  up: "a2dp_sink_ldac",
                  down: "headset_head_unit"
              }
          }
      },
      {
        id: 21,
        service: "exec",
        type: "command",
        item: {
            up: "pacmd set-source-port alsa_input.pci-0000_00_1f.3.analog-stereo analog-input-headset-mic && set-sink-port alsa_output.pci-0000_00_1f.3.analog-stereo analog-output-speaker && set-source-volume alsa_input.pci-0000_00_1f.3.analog-stereo 0x10000",
            down: "pacmd set-source-port alsa_input.pci-0000_00_1f.3.analog-stereo analog-input-internal-mic",
            status: "false"
        }
    },

      
  ]


}