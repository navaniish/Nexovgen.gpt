import torch
from torch.utils.data import Dataset, DataLoader
import numpy as np
import os
from typing import List

class PretrainDataset(Dataset):
    def __init__(self, data_path: str, seq_len: int):
        self.data_path = data_path
        self.seq_len = seq_len
        # Assuming data is pre-tokenized and stored as memory-mapped numpy nodes
        if os.path.exists(data_path):
            self.data = np.memmap(data_path, dtype=np.uint16, mode='r')
        else:
            # Placeholder for toy training if file doesn't exist
            print(f"Warning: Data path {data_path} not found. Using dummy data.")
            self.data = np.random.randint(0, 32000, size=(1000000,), dtype=np.uint16)

    def __len__(self):
        return len(self.data) // (self.seq_len + 1)

    def __getitem__(self, idx):
        start = idx * self.seq_len
        end = start + self.seq_len + 1
        chunk = torch.from_numpy(self.data[start:end].astype(np.int64))
        x = chunk[:-1]
        y = chunk[1:]
        return x, y

def get_dataloader(data_path: str, seq_len: int, batch_size: int, world_size: int = 1, rank: int = 0):
    dataset = PretrainDataset(data_path, seq_len)
    sampler = torch.utils.data.distributed.DistributedSampler(
        dataset, num_replicas=world_size, rank=rank, shuffle=True
    )
    return DataLoader(
        dataset,
        batch_size=batch_size,
        sampler=sampler,
        num_workers=4,
        pin_memory=True
    )
