import { useCallback } from 'react';
import keyManager from '../../services/keyManager';
import { decryptForRoom, decryptPrivateMessage } from '../../utils/crypto';

export const useChatCrypto = ({ roomPrivateKey, myId }) => {
  const decryptRoomMsg = useCallback(async (raw) => {
    let replyTo = raw.replyTo;
    if (replyTo?.iv && replyTo?.wrappedKey && roomPrivateKey) {
      try {
        const replyText = await decryptForRoom(replyTo.text ?? '', replyTo.iv, replyTo.wrappedKey, roomPrivateKey);
        const { iv: _iv, wrappedKey: _wk, ...restReply } = replyTo;
        replyTo = { ...restReply, text: replyText };
      } catch (err) {
        console.error('[ChatScreen] room replyTo decrypt error:', err.message);
        const { iv: _iv, wrappedKey: _wk, ...restReply } = replyTo;
        replyTo = { ...restReply, text: 'Unable to decrypt message' };
      }
    }
    if (!raw.iv || !raw.wrappedKey) return { ...raw, replyTo }; // genuinely unencrypted
    if (!roomPrivateKey) {
      const { iv, wrappedKey, ...rest } = raw;
      return { ...rest, text: 'Unable to decrypt message', replyTo };
    }
    try {
      const text = await decryptForRoom(raw.text ?? raw.message ?? '', raw.iv, raw.wrappedKey, roomPrivateKey);
      const { iv, wrappedKey, ...rest } = raw;
      return { ...rest, text, replyTo };
    } catch (err) {
      console.error('[ChatScreen] room decrypt error:', err.message);
      const { iv, wrappedKey, ...rest } = raw;
      return { ...rest, text: 'Unable to decrypt message', replyTo };
    }
  }, [roomPrivateKey]);

  const decryptPrivateMsg = useCallback(async (raw) => {
    const privateKeyPem = await keyManager.getSelfPrivateKey();

    let replyTo = raw.replyTo;
    if (replyTo?.iv && privateKeyPem) {
      const isReplyOwn = String(replyTo.senderId) === String(myId);
      const replyWrappedKeyForMe = isReplyOwn ? replyTo.senderKeyWrapped : replyTo.receiverKeyWrapped;
      const { iv: _iv, senderKeyWrapped: _skw, receiverKeyWrapped: _rkw, ...restReply } = replyTo;
      if (replyWrappedKeyForMe) {
        try {
          const replyText = await decryptPrivateMessage(replyTo.text ?? '', replyTo.iv, replyWrappedKeyForMe, privateKeyPem);
          replyTo = { ...restReply, text: replyText };
        } catch (err) {
          console.error('[ChatScreen] private replyTo decrypt error:', err.message);
          replyTo = { ...restReply, text: 'Unable to decrypt message' };
        }
      } else {
        replyTo = { ...restReply, text: 'Unable to decrypt message' };
      }
    }

    if (!raw.iv) return { ...raw, replyTo }; // genuinely unencrypted
    if (!privateKeyPem) {
      const { iv, senderKeyWrapped, receiverKeyWrapped, ...rest } = raw;
      return { ...rest, text: 'Unable to decrypt message', replyTo };
    }
    const isOwn = String(raw.senderId) === String(myId);
    const wrappedKeyForMe = isOwn ? raw.senderKeyWrapped : raw.receiverKeyWrapped;
    if (!wrappedKeyForMe) {
      const { iv, senderKeyWrapped, receiverKeyWrapped, ...rest } = raw;
      return { ...rest, text: 'Unable to decrypt message', replyTo };
    }
    try {
      const text = await decryptPrivateMessage(raw.text ?? raw.content ?? '', raw.iv, wrappedKeyForMe, privateKeyPem);
      const { iv, senderKeyWrapped, receiverKeyWrapped, ...rest } = raw;
      return { ...rest, text, replyTo };
    } catch (err) {
      console.error('[ChatScreen] private decrypt error:', err.message);
      const { iv, senderKeyWrapped, receiverKeyWrapped, ...rest } = raw;
      return { ...rest, text: 'Unable to decrypt message', replyTo };
    }
  }, [myId]);

  return { decryptRoomMsg, decryptPrivateMsg };
};
