using System.Diagnostics;

public class CircularArray<T>
    {
        int _size, _head, _tail, _peek = -1;
        T[] _values;

        public CircularArray(int size)
        {
            _size = size;
            Clear();
        }

        public void Clear()
        {
            _head = _peek = _tail = -1;
            _values = new T[_size];
        }

        public void Push(T item)
        {
            //Debug.WriteLine("PUSH");
            _head++;

            if (_head == _size)
            {
                _head = 0;
            }

            _peek = _head;

            if (_head == _tail)
            {
                _tail++;
            }

            if (_tail == _size)
            {
                _tail = 0;
            }

            if (_tail == -1)
            {
                _tail = 0;
            }

            _values[_head] = item;
        }

        public bool PeekAtHead()
        {
            //Debug.WriteLine("PEEKATHEAD");
            return _peek == _head;
        }

        public T PeekBack()
        {
            //Debug.WriteLine("PEEKBACK");

            if (_peek != _tail)
            {
                _peek--;
            }

            if (_peek < 0)
            {
                _peek = _size - 1;
            }

            return _values[_peek];
        }

        public T PeekForward()
        {
            //Debug.WriteLine("PEEKFORWARD");

            if (_peek != _head)
            {
                _peek++;
            }

            if (_peek == _size)
            {
                _peek = 0;
            }

            return _values[_peek];
        }
    }