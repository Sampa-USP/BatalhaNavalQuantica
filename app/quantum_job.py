from braket.aws import AwsSession, AwsDevice
from braket.circuits import Circuit
from boto3 import Session

# Criando sessão AWS
boto_session = Session(profile_name='bracket')
aws_session = AwsSession(boto_session=boto_session)

# Selecionando o dispositivo AWS Braket
device_arn = "arn:aws:braket:::device/quantum-simulator/amazon/sv1"
device = AwsDevice(device_arn, aws_session=aws_session)

# Criando o circuito quântico
num_qubits = 10  # Usa 10 qubits
circuit = Circuit()
for i in range(num_qubits):
    circuit.h(i)
for i in range(num_qubits):
    circuit.measure(i)

# Executando o circuito
shots = 10
task = device.run(circuit, shots=shots)
result = task.result()
counts = result.measurement_counts

# Convertendo os resultados em coordenadas cartesianas
num_bits_x = 5  # Definir a quantidade de bits para X
num_bits_y = 5  # Definir a quantidade de bits para Y

def binary_to_cartesian(binary_str):
    x = int(binary_str[:num_bits_x], 2)
    y = int(binary_str[num_bits_x:num_bits_x + num_bits_y], 2)
    return x, y

# Imprimindo os pontos para que o Flask capture
for binary in counts.keys():
    print(binary)

