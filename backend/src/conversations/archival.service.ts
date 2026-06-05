import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Conversation } from './schemas/conversation.schema';
import { ConversationArchive } from './schemas/conversation-archive.schema';

const MAX_MESSAGES = 2000;

@Injectable()
export class ArchivalService implements OnModuleInit {
  private readonly logger = new Logger(ArchivalService.name);

  constructor(
    @InjectModel(Conversation.name)
    private readonly convModel: Model<Conversation>,
    @InjectModel(ConversationArchive.name)
    private readonly archiveModel: Model<ConversationArchive>,
  ) {}

  onModuleInit() {
    // run periodically in background every hour
    setInterval(
      () => {
        this.runSweep().catch((err) =>
          this.logger.error('Archival sweep failed', err),
        );
      },
      1000 * 60 * 60,
    );
  }

  async runSweep() {
    // Find conversations with messages array longer than MAX_MESSAGES
    const convs = await this.convModel
      .find({ $expr: { $gt: [{ $size: '$messages' }, MAX_MESSAGES] } })
      .exec();

    for (const conv of convs) {
      try {
        const len = conv.messages.length;
        const numToArchive = len - 500; // keep 500 recent
        if (numToArchive <= 0) continue;

        const messagesToArchive = conv.messages.slice(0, numToArchive);
        await this.archiveModel.create({
          conversationId: conv._id,
          messages: messagesToArchive,
        });
        conv.messages = conv.messages.slice(numToArchive);
        await conv.save();

        this.logger.log(
          `Archived ${numToArchive} messages from conversation ${conv._id}`,
        );
      } catch (err) {
        this.logger.error('Failed to archive conversation', err);
      }
    }
  }
}
