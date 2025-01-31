from torchvision import transforms, datasets, models
import torch
from torch import optim, cuda
from torch.utils.data import DataLoader, sampler, random_split, Dataset
import torch.nn as nn
import numpy as np

def get_model(n_classes, model_name):
    # Whether to train on a gpu
    train_on_gpu = cuda.is_available()
    # print(f'Train on gpu: {train_on_gpu}')
    multi_gpu = False
    # Number of gpus
    if train_on_gpu:
        gpu_count = cuda.device_count()
        # print(f'{gpu_count} gpus detected.')
        if gpu_count > 1:
            multi_gpu = True
        else:
            multi_gpu = False
    if model_name == 'resnet18':
        model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    elif model_name == 'resnet34':
        model = models.resnet34(weights=models.ResNet34_Weights.DEFAULT)
    elif model_name == 'resnext32':
        model = models.resnext101_32x8d(weights=models.ResNeXt101_32X8D_Weights.DEFAULT)
    for param in model.parameters():
        param.requires_grad = False
    n_inputs = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(n_inputs, 256), nn.ReLU(), nn.Dropout(0.2),
        nn.Linear(256, n_classes), nn.LogSoftmax(dim=1))
    if train_on_gpu:
        model = model.to('cuda')

    if multi_gpu:
        model = nn.DataParallel(model)

    return model


def train(model,
          criterion,
          optimizer,
          train_loader,
          valid_loader,
          save_file_name,
          max_epochs_stop=3,
          n_epochs=20,
          print_every=2):
    """Train a PyTorch Model

    Params
    --------
        model (PyTorch model): cnn to train
        criterion (PyTorch loss): objective to minimize
        optimizer (PyTorch optimizier): optimizer to compute gradients of model parameters
        train_loader (PyTorch dataloader): training dataloader to iterate through
        valid_loader (PyTorch dataloader): validation dataloader used for early stopping
        save_file_name (str ending in '.pt'): file path to save the model state dict
        max_epochs_stop (int): maximum number of epochs with no improvement in validation loss for early stopping
        n_epochs (int): maximum number of training epochs
        print_every (int): frequency of epochs to print training stats

    Returns
    --------
        model (PyTorch model): trained cnn with best weights
        history (DataFrame): history of train and validation loss and accuracy
    """
    train_on_gpu = cuda.is_available()

    # Early stopping intialization
    epochs_no_improve = 0
    valid_loss_min = np.Inf

    valid_max_acc = 0
    # Number of epochs already trained (if using loaded in model weights)
    # try:
    #     print(f'Model has been trained for: {model.epochs} epochs.\n')
    # except:
    #     model.epochs = 0
    #     print(f'Starting Training from Scratch.\n')

    # overall_start = timer()

    # Main loop
    for epoch in range(n_epochs):

        # keep track of training and validation loss each epoch
        train_loss = 0.0
        valid_loss = 0.0
        # test_loss = 0.0

        train_acc = 0
        valid_acc = 0
        # test_acc = 0

        # Set to training
        model.train()
        # start = timer()
        # Training loop
        for ii, (data, target) in enumerate(train_loader):
            # Tensors to gpu
            if train_on_gpu:
                data, target = data.cuda(), target.cuda()
                # data = data.float()
                # target = target.float()
                data.byte()

            # Clear gradients
            optimizer.zero_grad()
            # Predicted outputs are log probabilities
            output = model(data.to(torch.float32))

            # Loss and backpropagation of gradients
            # target.resize_(128, 2)
            loss = criterion(output, target)
            loss.backward()

            # Update the parameters
            optimizer.step()

            # Track train loss by multiplying average loss by number of examples in batch
            train_loss += loss.item() * data.size(0)

            # Calculate accuracy by finding max log probability
            _, pred = torch.max(output, dim=1)
            correct_tensor = pred.eq(target.data.view_as(pred))
            # Need to convert correct tensor from int to float to average
            accuracy = torch.mean(correct_tensor.type(torch.FloatTensor))
            # Multiply average accuracy times the number of examples in batch
            train_acc += accuracy.item() * data.size(0)

            # Track training progress
            # print(
            #     f'Epoch: {epoch}\t{100 * (ii + 1) / len(train_loader):.2f}% complete.',
            #     end='\r')

        # After training loops ends, start validation
        else:
            # model.epochs += 1

            # Don't need to keep track of gradients
            with torch.no_grad():
                # Set to evaluation mode
                model.eval()

                # Validation loop
                for data, target in valid_loader:
                    # Tensors to gpu
                    if train_on_gpu:
                        data, target = data.cuda(), target.cuda()
                        # data = data.float()
                        # target = target.float()
                        data.byte()
                    # Forward pass
                    output = model(data.to(torch.float32))
                    # Validation loss
                    loss = criterion(output, target)
                    # Multiply average loss times the number of examples in batch
                    valid_loss += loss.item() * data.size(0)
                    # Calculate validation accuracy
                    _, pred = torch.max(output, dim=1)
                    correct_tensor = pred.eq(target.data.view_as(pred))
                    accuracy = torch.mean(
                        correct_tensor.type(torch.FloatTensor))
                    # Multiply average accuracy times the number of examples
                    valid_acc += accuracy.item() * data.size(0)

                # Calculate average losses
                train_loss = train_loss / len(train_loader.dataset)
                valid_loss = valid_loss / len(valid_loader.dataset)

                # Calculate average accuracy
                train_acc = train_acc / len(train_loader.dataset)
                valid_acc = valid_acc / len(valid_loader.dataset)

                # history.append([train_loss, valid_loss, train_acc, valid_acc])

                # Print training and validation results
                # if (epoch + 1) % print_every == 0:
                    # print(
                    #     f'\nEpoch: {epoch} \tTraining Loss: {train_loss:.4f} \tValidation Loss: {valid_loss:.4f}'
                    # )
                    # print(
                    #     f'\t\tTraining Accuracy: {100 * train_acc:.2f}%\t Validation Accuracy: {100 * valid_acc:.2f}%'
                    # )

                # Save the model if validation loss decreases
                if valid_loss < valid_loss_min:
                    # Save model
                    torch.save(model.state_dict(), save_file_name)
                    # Track improvement
                    epochs_no_improve = 0
                    valid_loss_min = valid_loss
                    valid_best_acc = valid_acc
                    best_epoch = epoch

                # Otherwise increment count of epochs with no improvement
                else:
                    epochs_no_improve += 1
                    # Trigger early stopping
                    if epochs_no_improve >= max_epochs_stop:
                        # print(
                        #     f'\nEarly Stopping! Total epochs: {epoch}. Best epoch: {best_epoch} with loss: {valid_loss_min:.2f} and acc: {100 * valid_acc:.2f}%'
                        # )
                        # Load the best state dict
                        model.load_state_dict(torch.load(save_file_name))
                        # Attach the optimizer
                        model.optimizer = optimizer

                        return model

    # Attach the optimizer
    model.optimizer = optimizer

    # print(
    #     f'\nBest epoch: {best_epoch} with loss: {valid_loss_min:.2f} and acc: {100 * valid_acc:.2f}%'
    # )

    return model


def train_model(model, train_set, val, num_epoch):

    train_loader = DataLoader(train_set, batch_size=64, shuffle=True)
    # test_loader = DataLoader(test, batch_size=64, shuffle=True)
    val_loader = DataLoader(val, batch_size=64, shuffle=True)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.SGD(model.parameters(), lr=0.03, weight_decay=0.0001)
    model = train(
        model,
        criterion,
        optimizer,
        train_loader,
        val_loader,
        save_file_name='finetuned.pt',
        max_epochs_stop=3,
        n_epochs=num_epoch,
        print_every=1)

    # scores = (history['test_loss'].values, history['test_acc'].values)
    # print('Initial Test Loss: ', scores[0], ' Initial Test Accuracy: ', scores[1])
    return model


def resnet(train_data, val_data, pool_data, test_data, n_classes, epochs, model_name):
    train_on_gpu = cuda.is_available()

    model = get_model(n_classes, model_name)

    model = train_model(model, train_data, val_data, epochs)

    # print("Initial length of train data", len(train_data))
    # print("Initial length of pool_data", len(pool_data))

    # Get the predictions for the pool data
    pool_loader = DataLoader(pool_data, batch_size=64, shuffle=False)
    # Create the empty list to store the predictions
    y_pred = []
    for inputs, _ in pool_loader:
        # Move to GPU if available
        if train_on_gpu:
            inputs = inputs.cuda()
            inputs.byte()
        # Forward pass
        output = model(inputs.to(torch.float32))
        # Reverse one-hot encoding
        _, pred = torch.max(output, 1)
        y_pred.extend(pred.cpu().numpy())
    
    # Get the predictions for the test data
    test_loader = DataLoader(test_data, batch_size=64, shuffle=False)
    # Create the empty list to store the predictions
    y_pred_test = []
    for inputs, _ in test_loader:
        # Move to GPU if available
        if train_on_gpu:
            inputs = inputs.cuda()
            inputs.byte()
        # Forward pass
        output = model(inputs.to(torch.float32))
        # Reverse one-hot encoding
        _, pred = torch.max(output, 1)
        y_pred_test.extend(pred.cpu().numpy())

    return y_pred, y_pred_test