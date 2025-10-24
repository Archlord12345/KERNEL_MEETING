import PropTypes from 'prop-types';
import { Card, Grid, Stack, Typography, Avatar } from '@mui/material';

const VideoGrid = ({ localStream, participants, remoteStreamsRef, localVideoRef }) => {
  const renderVideo = (participant) => {
    const videoProps = {
      autoPlay: true,
      playsInline: true,
      muted: participant.id === 'local',
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: 16,
      },
      ref:
        participant.id === 'local'
          ? (element) => {
              if (element && localStream) {
                element.srcObject = localStream;
                if (localVideoRef) {
                  localVideoRef.current = element;
                }
              }
            }
          : (element) => {
              if (element && remoteStreamsRef.current[participant.id]) {
                element.srcObject = remoteStreamsRef.current[participant.id];
              }
            },
    };

    return <video {...videoProps} />;
  };

  return (
    <Grid container spacing={2}>
      {participants.map((participant) => (
        <Grid item xs={12} md={participants.length > 1 ? 6 : 12} key={participant.id}>
          <Card sx={{ p: 2 }}>
            <Stack spacing={2}>
              <div style={{ aspectRatio: '16 / 9', borderRadius: 16, overflow: 'hidden' }}>
                {renderVideo(participant)}
              </div>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar>{participant.name.charAt(0)}</Avatar>
                <Stack>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {participant.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {participant.id === 'local' ? 'Vous' : 'Participant en ligne'}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

VideoGrid.propTypes = {
  localStream: PropTypes.object,
  participants: PropTypes.array.isRequired,
  remoteStreamsRef: PropTypes.object.isRequired,
  localVideoRef: PropTypes.object,
};

export default VideoGrid;
