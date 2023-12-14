import { BaseMediaConnection } from '$stream/Streamer/client/connections/BaseMediaConnection';
import { StreamConnection } from '$stream/Streamer/client/connections/StreamConnection';

export class VoiceConnection extends BaseMediaConnection {
  public streamConnection?: StreamConnection;

  public override get serverId(): string {
    return this.guildId;
  }

  public override stop(): void {
    super.stop();
    this.streamConnection?.stop();
  }
}
