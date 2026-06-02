'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export type AnySocket = Socket<any, any> | null;

export function useSocket(namespace = '/ws') {
  const socketRef = useRef<AnySocket>(null);

  useEffect(() => {
    const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!backendBaseUrl) {
      return;
    }

    // connect directly to the NestJS backend namespace; otherwise Next.js receives the polling requests
    const socket = io(`${backendBaseUrl}${namespace}`, {
      autoConnect: true,
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('socket connected', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('socket disconnected');
    });

    return () => {
      socket.disconnect();
      console.log('socket disconnected (cleanup)');
      socketRef.current = null;
    };
  }, [namespace]);

  return socketRef;
}
